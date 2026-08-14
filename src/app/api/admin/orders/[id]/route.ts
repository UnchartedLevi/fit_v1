import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateOrderSchema = z.object({
  fulfilment_status: z.enum(["unfulfilled", "processing", "shipped", "delivered", "cancelled"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const parsed = updateOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid fulfilment status." }, { status: 400 });

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });

  const { data: currentOrder } = await supabase.from("orders").select("payment_status").eq("id", id).single();
  if (!currentOrder) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (currentOrder.payment_status !== "paid") {
    return NextResponse.json({ error: "Only verified paid orders can enter fulfilment." }, { status: 409 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({ fulfilment_status: parsed.data.fulfilment_status })
    .eq("id", id)
    .select("id,order_number,customer_email,customer_phone,total_amount,payment_status,status,fulfilment_status,created_at,fulfilled_at,delivery_address_snapshot")
    .single();

  if (error || !order) return NextResponse.json({ error: error?.message || "Could not update order." }, { status: 500 });
  return NextResponse.json({ order });
}
