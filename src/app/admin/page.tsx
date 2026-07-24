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
    <>
      <span className="eyebrow">MANAGER OVERVIEW</span>
      <h1>Good day.</h1>
      <p>Manage the Supabase-backed FITS store without touching code.</p>
      <div className="stat-grid">
        <div className="stat"><b>{productsResult?.count ?? 0}</b><span>Active products</span></div>
        <div className="stat"><b>{pendingOrdersResult?.count ?? 0}</b><span>Open orders</span></div>
        <div className="stat"><b>{money(revenue)}</b><span>Verified sales</span></div>
        <div className="stat"><b>{lowStockResult?.count ?? 0}</b><span>Low-stock variants</span></div>
      </div>
    </>
  );
}
