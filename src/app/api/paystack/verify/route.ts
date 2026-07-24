import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderNotificationEmails } from "@/lib/email";

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    gateway_response?: string;
    reference?: string;
    paid_at?: string;
  };
};

type VerifiedOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paystack_reference: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_snapshot: Record<string, unknown>;
  created_at: string;
  order_items?: {
    quantity: number;
    unit_price: number;
    variant_description: string | null;
    product_name: string;
    line_total: number;
  }[];
};

export async function GET(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const reference = new URL(req.url).searchParams.get("reference");
    if (!secret || !reference) throw new Error("Missing payment configuration or reference.");

    const verify = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const json = (await verify.json()) as PaystackVerifyResponse;
    if (!verify.ok || json.data?.status !== "success") throw new Error(json.message || "Payment has not been verified.");

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,order_number,total_amount,currency,payment_status,paystack_reference,customer_email,customer_phone,delivery_address_snapshot,created_at,order_items(quantity,unit_price,variant_description,product_name,line_total)",
      )
      .eq("paystack_reference", reference)
      .single();

    if (orderError || !orderData) throw new Error("Order not found for payment reference.");

    const order = orderData as unknown as VerifiedOrder;
    if (json.data?.amount !== order.total_amount * 100 || json.data.currency !== order.currency) {
      throw new Error("Payment amount does not match the order.");
    }

    const wasPaid = order.payment_status === "paid";
    const { error } = await supabase.rpc("finalize_paid_order", {
      p_reference: reference,
      p_amount: order.total_amount,
      p_currency: order.currency,
      p_channel: json.data.channel ?? null,
      p_gateway_response: json.data.gateway_response ?? null,
      p_metadata: { paystack_paid_at: json.data.paid_at ?? null },
    });
    if (error) throw error;

    if (!wasPaid) {
      await sendOrderNotificationEmails(order);
    }

    return NextResponse.json({ verified: true, order_id: order.id, order_number: order.order_number });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}
