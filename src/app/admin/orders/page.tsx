import { requireAdmin } from "@/lib/auth";
import { AdminOrdersEditor, type AdminOrder } from "@/components/admin-orders-editor";

export default async function Orders() {
  const auth = await requireAdmin();
  const { data } = await auth.supabase
    .from("orders")
    .select("id,order_number,customer_email,customer_phone,total_amount,payment_status,status,fulfilment_status,created_at,fulfilled_at,delivery_address_snapshot")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as AdminOrder[];

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <span className="eyebrow">FULFILMENT</span>
          <h1>Orders</h1>
          <p>Track payments and fulfilment for FITS campus deliveries.</p>
        </div>
        <div className="admin-chip">Order monitoring</div>
      </section>

      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__head">
          <h2>Recent orders</h2>
          <p>View key customer and delivery details in a clearer, scannable format.</p>
        </div>

        <AdminOrdersEditor initialOrders={orders} />
      </section>
    </div>
  );
}
