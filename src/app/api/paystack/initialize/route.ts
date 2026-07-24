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
    hall: z.enum(["Peter", "Joshua", "Joseph", "Daniel", "Paul", "John"]),
    room: z.string().regex(/^[A-Za-z][0-9]{3}$/, "Room number must be one letter followed by three digits"),
  }),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        size: z.string().min(1),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1),
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

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack is not configured yet.");

    const body = Body.parse(await req.json());
    const session = await createClient();
    const supabase = createAdminClient();
    if (!session || !supabase) throw new Error("Supabase is not configured yet.");

    const productIds = [...new Set(body.items.map((item) => item.product_id))];
    const { data, error } = await supabase
      .from("products")
      .select("id,name,base_price,currency,status,product_images(*),product_variants(*)")
      .in("id", productIds);

    if (error || !data) throw new Error("Could not validate products.");

    const products = data as unknown as CheckoutProduct[];
    let subtotal = 0;
    const orderItems = body.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.product_id);
      if (!product || product.status !== "active") throw new Error("A product in your bag is no longer available.");

      const variants = (product.product_variants ?? []).filter((variant) => variant.is_active);
      const variant = variants.find((candidate) => candidate.size === item.size) ?? variants[0];
      if (!variant) throw new Error(`${product.name} has no available variants.`);
      if (variant.stock_quantity < item.quantity) throw new Error(`${product.name} does not have enough stock.`);

      const unitPrice = variant.price_override ?? product.base_price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_description: [variant.size, variant.colour].filter(Boolean).join(" / "),
        sku: variant.sku,
        image_url: product.product_images?.find((image) => image.is_primary)?.image_url ?? product.product_images?.[0]?.image_url ?? null,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const {
      data: { user },
    } = await session.auth.getUser();

    const { data: orderNumber, error: numberError } = await supabase.rpc("generate_order_number");
    if (numberError || !orderNumber) throw new Error("Could not generate an order number.");

    const reference = `${orderNumber}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const deliverySnapshot = {
      recipient_name: body.customer.name,
      phone: body.customer.phone,
      address_line_1: `Hall: ${body.customer.hall}, Room: ${body.customer.room.toUpperCase()}`,
      city: "Ota",
      state: "Ogun",
      country: "Nigeria",
      delivery_instructions: "Covenant University campus delivery",
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
        discount_amount: 0,
        delivery_fee: 0,
        tax_amount: 0,
        total_amount: subtotal,
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
      amount: subtotal,
      currency: "NGN",
      status: "pending",
      metadata: { order_number: orderNumber },
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
        amount: subtotal * 100,
        currency: "NGN",
        reference,
        callback_url: `${origin}/checkout/callback`,
        metadata: { order_id: order.id, order_number: orderNumber },
      }),
    });

    const json = (await paystackResponse.json()) as PaystackInitResponse;
    if (!paystackResponse.ok || !json.status || !json.data) throw new Error(json.message || "Payment initialization failed.");

    return NextResponse.json(json.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
