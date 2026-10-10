import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FulfilmentStatus, PaymentStatus, OrderStatus } from "@/lib/commerce-types";

export type CustomerOrder = {
  id: string; order_number: string; created_at: string; paid_at: string | null;
  payment_status: PaymentStatus; fulfilment_status: FulfilmentStatus; status: OrderStatus;
  subtotal: number; discount_amount: number; delivery_fee: number; tax_amount: number; total_amount: number;
  customer_email: string; customer_phone: string; paystack_reference: string | null;
  delivery_address_snapshot: { recipient_name?: string; address_line_1?: string; shipping_zone?: string; shipping_eta?: string; };
  order_items: { id: string; product_name: string; variant_description: string | null; quantity: number; unit_price: number; line_total: number }[];
};

const fields = "id,order_number,created_at,paid_at,payment_status,fulfilment_status,status,subtotal,discount_amount,delivery_fee,tax_amount,total_amount,customer_email,customer_phone,paystack_reference,delivery_address_snapshot,order_items(id,product_name,variant_description,quantity,unit_price,line_total)";

export async function requireCustomer(next = "/account") {
  const supabase = await createClient();
  if (!supabase) throw new Error("Account service is unavailable.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  return { supabase, user: data.user };
}

export async function listCustomerOrders(page: number) {
  const { supabase, user } = await requireCustomer();
  const size = 12;
  const { data, count, error } = await supabase.from("orders")
    .select(fields, { count: "exact" }).eq("user_id", user.id)
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (error) throw new Error("Unable to load your orders. Please try again.");
  return { orders: (data ?? []) as CustomerOrder[], total: count ?? 0, size, user };
}

export async function getCustomerOrder(id: string, receipt = false) {
  const { supabase, user } = await requireCustomer(`/account/orders/${id}${receipt ? "/receipt" : ""}`);
  // Validate IDs before querying, but still require authentication for every request.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await supabase.from("orders").select(fields)
    .eq("user_id", user.id).eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load this order. Please try again.");
  return data as CustomerOrder | null;
}

export function orderDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export function deliveryProgress(order: Pick<CustomerOrder, "payment_status" | "fulfilment_status" | "status">) {
  if (order.payment_status === "refunded" || order.status === "refunded") return { step: -1, message: "This order has been refunded." };
  if (order.status === "cancelled" || order.fulfilment_status === "cancelled") return { step: -1, message: "This order has been cancelled." };
  if (order.payment_status !== "paid") return { step: -1, message: order.payment_status === "failed" ? "Payment was not completed." : "Awaiting payment confirmation." };
  const steps = { unfulfilled: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };
  return { step: steps[order.fulfilment_status], message: "Delivery status is updated by the FITS team. This is not live courier tracking." };
}
