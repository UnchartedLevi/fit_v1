import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/products";

type AdminOrder = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status: string;
  status: string;
  fulfilment_status: string;
  created_at: string;
  delivery_address_snapshot?: {
    recipient_name?: string;
  };
};

export default async function Orders() {
  const auth = await requireAdmin();
  const { data } = await auth.supabase
    .from("orders")
    .select("id,order_number,customer_email,customer_phone,total_amount,payment_status,status,fulfilment_status,created_at,delivery_address_snapshot")
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

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Fulfilment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>
                      {order.delivery_address_snapshot?.recipient_name ?? "Customer"}
                      <small className="admin-table-meta">{order.customer_email}</small>
                      <small className="admin-table-meta">{order.customer_phone}</small>
                    </td>
                    <td>{money(order.total_amount)}</td>
                    <td><span className="badge">{order.payment_status}</span></td>
                    <td>{order.fulfilment_status}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6}>No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
