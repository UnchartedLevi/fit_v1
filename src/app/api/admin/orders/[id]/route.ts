import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/email";

const updateOrderSchema = z.object({ customer_email: z.string().email().optional(), customer_phone: z.string().min(7).optional(), total_amount: z.number().int().nonnegative().optional(), fulfilment_status: z.enum(["unfulfilled", "processing", "shipped", "delivered", "cancelled"]).optional(), delivery_address_snapshot: z.record(z.string(), z.unknown()).optional() });

async function authorize() {
  const session = await createClient();
  if (!session) return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const { data: profile } = await session.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  const admin = createAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "Admin database access is not configured." }, { status: 503 }) };
  return { admin };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("error" in auth) return auth.error;
  const parsed = updateOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the order fields and try again." }, { status: 400 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  const { data: currentOrder } = await auth.admin.from("orders").select("id,order_number,customer_email,payment_status,fulfilment_status,delivery_address_snapshot").eq("id", id).single();
  if (!currentOrder) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (parsed.data.fulfilment_status && parsed.data.fulfilment_status !== "unfulfilled" && currentOrder.payment_status !== "paid") return NextResponse.json({ error: "Only verified paid orders can enter fulfilment." }, { status: 409 });
  const { data: order, error } = await auth.admin.from("orders").update(parsed.data).eq("id", id).select("id,order_number,customer_email,customer_phone,total_amount,payment_status,status,fulfilment_status,created_at,fulfilled_at,delivery_address_snapshot").single();
  if (error || !order) return NextResponse.json({ error: error?.message || "Could not update order." }, { status: 500 });
  if (parsed.data.fulfilment_status && parsed.data.fulfilment_status !== currentOrder.fulfilment_status && ["shipped", "delivered"].includes(parsed.data.fulfilment_status)) await sendOrderStatusEmail({ order_number: order.order_number, customer_email: order.customer_email, fulfilment_status: parsed.data.fulfilment_status as "shipped" | "delivered", delivery_address_snapshot: order.delivery_address_snapshot as Record<string, unknown> });
  return NextResponse.json({ order });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("error" in auth) return auth.error;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  const { error } = await auth.admin.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
