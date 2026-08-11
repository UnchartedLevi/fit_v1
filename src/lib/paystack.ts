import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderNotificationEmails } from "@/lib/email";

export type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    id?: number;
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

export function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured yet.");
  return secret;
}

export async function verifyPaystackReference(reference: string) {
  const secret = getPaystackSecret();
  const verify = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const json = (await verify.json()) as PaystackVerifyResponse;
  if (!verify.ok || !json.status || json.data?.status !== "success") {
    throw new Error(json.message || "Payment has not been verified.");
  }
  return json;
}

export function isValidPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const secret = getPaystackSecret();
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function markEmailNotificationStarted(reference: string) {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("payment_events")
    .insert({
      provider: "paystack",
      event_id: `confirmation-email:${reference}`,
      provider_reference: reference,
      event_type: "fits.order_confirmation_email",
      payload: { reference },
    })
    .select("id")
    .single();

  if (error || !data) return false;
  return true;
}

async function markEmailNotificationProcessed(reference: string) {
  const supabase = createAdminClient();
  if (!supabase) return;

  await supabase
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "paystack")
    .eq("event_id", `confirmation-email:${reference}`);
}

export async function finalizeVerifiedPaystackPayment(params: {
  reference: string;
  amount: number;
  currency: string;
  channel?: string | null;
  gatewayResponse?: string | null;
  paidAt?: string | null;
}) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,order_number,total_amount,currency,payment_status,paystack_reference,customer_email,customer_phone,delivery_address_snapshot,created_at,order_items(quantity,unit_price,variant_description,product_name,line_total)",
    )
    .eq("paystack_reference", params.reference)
    .single();

  if (orderError || !orderData) throw new Error("Order not found for payment reference.");

  const order = orderData as unknown as VerifiedOrder;
  const expectedAmountInKobo = order.total_amount * 100;
  const paidCurrency = params.currency.toUpperCase();

  if (paidCurrency !== order.currency) {
    throw new Error("Payment currency does not match the order.");
  }

  if (params.amount < expectedAmountInKobo) {
    throw new Error("Payment amount is less than the order total.");
  }

  const { error } = await supabase.rpc("finalize_paid_order", {
    p_reference: params.reference,
    p_amount: order.total_amount,
    p_currency: order.currency,
    p_channel: params.channel ?? null,
    p_gateway_response: params.gatewayResponse ?? null,
    p_metadata: { paystack_paid_at: params.paidAt ?? null },
  });
  if (error) throw error;

  const shouldSendEmail = await markEmailNotificationStarted(params.reference);
  if (shouldSendEmail) {
    await sendOrderNotificationEmails(order);
    await markEmailNotificationProcessed(params.reference);
  }

  return {
    order_id: order.id,
    order_number: order.order_number,
    email_sent: shouldSendEmail,
  };
}
