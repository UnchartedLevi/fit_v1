import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductImageRecord, ProductVariantRecord } from "@/lib/commerce-types";

const Body = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    address: z.string().min(8, "Enter your delivery address"),
  }),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        variant_id: z.uuid(),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1),
  shipping: z
    .object({
      id: z.string(),
      zone_name: z.string(),
      price: z.number().nonnegative(),
      eta: z.string().optional(),
    })
    .optional(),
  coupon: z
    .object({
      code: z.string(),
      discount: z.number().nonnegative(),
    })
    .optional(),
});

type CheckoutProduct = {
  id: string;
  name: string;
  base_price: number;
  currency: string;
  status: "draft" | "active" | "archived";
  product_images?: ProductImageRecord[];
  product_variants?: ProductVariantRecord[];
};

type PaystackInitResponse = {
  status?: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `FITS-${date}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Invalid request";
}

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack is not configured yet.");

    const body = Body.parse(await req.json());
    const session = await createClient();
    const supabase = createAdminClient();
    const productReader = session ?? supabase;
    if (!supabase) throw new Error("Supabase is not configured yet.");
    if (!productReader) throw new Error("Supabase is not configured yet.");

    const productIds = [...new Set(body.items.map((item) => item.product_id))];
    const { data: productData, error: productError } = await productReader
      .from("products")
      .select("id,name,base_price,currency,status")
      .in("id", productIds);

    if (productError || !productData) throw new Error("Could not validate products.");

    const [{ data: imageData, error: imageError }, { data: variantData, error: variantError }] = await Promise.all([
      productReader.from("product_images").select("*").in("product_id", productIds),
      productReader.from("product_variants").select("*").in("product_id", productIds),
    ]);

    if (imageError || variantError) throw new Error("Could not validate products.");

    const products = (productData as unknown as CheckoutProduct[]).map((product) => ({
      ...product,
      product_images: ((imageData ?? []) as ProductImageRecord[]).filter((image) => image.product_id === product.id),
      product_variants: ((variantData ?? []) as ProductVariantRecord[]).filter((variant) => variant.product_id === product.id),
    }));
    let subtotal = 0;
    const orderItems = body.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.product_id);
      if (!product || product.status !== "active") throw new Error("A product in your bag is no longer available.");

      const variants = (product.product_variants ?? []).filter((variant) => variant.is_active);
      const variant = variants.find((candidate) => candidate.id === item.variant_id);
      if (!variant) throw new Error(`${product.name} has no available variants.`);
      if (variant.stock_quantity < item.quantity) throw new Error(`${product.name} does not have enough stock.`);

      const unitPrice = variant.price_override ?? product.base_price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_description: [typeof variant.option_values?.option === "string" ? variant.option_values.option : null, variant.size && typeof variant.option_values?.option !== "string" && !["premium", "standard"].includes(variant.size.toLowerCase()) ? `Size ${variant.size}` : null, variant.size && typeof variant.option_values?.option !== "string" && ["premium", "standard"].includes(variant.size.toLowerCase()) ? variant.size : null, variant.colour && variant.colour !== "Default" ? variant.colour : null].filter(Boolean).join(" / ") || "One Size",
        sku: variant.sku,
        image_url: product.product_images?.find((image) => image.is_primary)?.image_url ?? product.product_images?.[0]?.image_url ?? null,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const {
      data: { user },
    } = session ? await session.auth.getUser() : { data: { user: null } };

    const deliveryFee = body.shipping?.price ?? 0;
    const discountAmount = body.coupon?.discount ?? 0;
    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    const orderNumber = generateOrderNumber();
    const reference = `${orderNumber}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const deliverySnapshot = {
      recipient_name: body.customer.name,
      phone: body.customer.phone,
      address_line_1: body.customer.address.trim(),
      shipping_zone: body.shipping?.zone_name ?? "Campus Delivery",
      shipping_eta: body.shipping?.eta ?? "",
      coupon_code: body.coupon?.code ?? null,
      city: "Ota",
      state: "Ogun",
      country: "Nigeria",
      delivery_instructions: "Covenant University campus delivery where applicable",
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone,
        status: "pending_payment",
        payment_status: "pending",
        fulfilment_status: "unfulfilled",
        currency: "NGN",
        subtotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        tax_amount: 0,
        total_amount: totalAmount,
        delivery_address_snapshot: deliverySnapshot,
        paystack_reference: reference,
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Could not create order.");

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) throw itemsError;

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      provider: "paystack",
      provider_reference: reference,
      amount: totalAmount,
      currency: "NGN",
      status: "pending",
      metadata: { order_number: orderNumber, coupon: body.coupon?.code, shipping_zone: body.shipping?.zone_name },
    });
    if (paymentError) throw paymentError;

    const origin = process.env.APP_URL || new URL(req.url).origin;
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.customer.email,
        amount: totalAmount * 100,
        currency: "NGN",
        reference,
        callback_url: `${origin}/checkout/callback`,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          customer_name: body.customer.name,
          shipping_zone: body.shipping?.zone_name,
          coupon_code: body.coupon?.code,
        },
      }),
    });

    const json = (await paystackResponse.json()) as PaystackInitResponse;
    if (!paystackResponse.ok || !json.status || !json.data) throw new Error(json.message || "Payment initialization failed.");

    return NextResponse.json(json.data);
  } catch (error) {
    console.error("Paystack initialization failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
