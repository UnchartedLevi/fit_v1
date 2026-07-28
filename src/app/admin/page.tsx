import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/products";

export default async function Admin() {
  const auth = await requireAdmin();
  const supabase = auth?.supabase;

  const [productsResult, pendingOrdersResult, paidOrdersResult, lowStockResult] = supabase
    ? await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending_payment", "confirmed", "processing"]),
        supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
        supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("is_active", true).lte("stock_quantity", 3),
      ])
    : [null, null, null, null];

  const revenue = paidOrdersResult?.data?.reduce((total, order) => total + Number(order.total_amount ?? 0), 0) ?? 0;

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <span className="eyebrow">MANAGER OVERVIEW</span>
          <h1>Good day.</h1>
          <p>Manage the Supabase-backed FITS store without touching code.</p>
        </div>
        <div className="admin-chip">Live catalogue sync</div>
      </section>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Active products</span>
          <b>{productsResult?.count ?? 0}</b>
          <small>Ready for shoppers</small>
        </div>
        <div className="stat">
          <span className="stat-label">Open orders</span>
          <b>{pendingOrdersResult?.count ?? 0}</b>
          <small>Needs attention</small>
        </div>
        <div className="stat">
          <span className="stat-label">Verified sales</span>
          <b>{money(revenue)}</b>
          <small>Paid and confirmed</small>
        </div>
        <div className="stat">
          <span className="stat-label">Low-stock variants</span>
          <b>{lowStockResult?.count ?? 0}</b>
          <small>Reorder soon</small>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Quick focus</h2>
            <p>Keep stock, pricing and fulfilment flowing smoothly.</p>
          </div>
          <ul className="admin-list">
            <li>Review low-stock items before they affect fulfilment.</li>
            <li>Keep product pages fresh with featured status and pricing updates.</li>
            <li>Track payment and fulfilment status from one place.</li>
          </ul>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Fast actions</h2>
            <p>Jump into the areas that need your attention most.</p>
          </div>
          <div className="admin-action-stack">
            <a href="/admin/products" className="admin-action-card">
              <strong>Update catalogue</strong>
              <span>Adjust products, prices and imagery.</span>
            </a>
            <a href="/admin/orders" className="admin-action-card">
              <strong>Review orders</strong>
              <span>Monitor payments and fulfilment progress.</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
