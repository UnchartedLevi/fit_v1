import Link from "next/link";
import { listCustomerOrders, orderDate } from "@/lib/customer-orders";
import { money } from "@/lib/products";

export default async function Account({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.page || 1);
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
  const { orders, total, size, user } = await listCustomerOrders(page);
  return <div className="page-shell account-page">
    <div className="account-heading"><div><p className="eyebrow">FITS ACCOUNT</p><h1>My orders</h1><p>{user.email}</p></div><Link className="button" href="/products">Continue shopping</Link></div>
    <p>Your purchases, delivery updates and paid receipts, all in one place.</p>
    <p className="account-note">Only orders placed while signed in to this account appear here. Guest purchases are not automatically linked.</p>
    {orders.length ? <><p>{total} order{total === 1 ? "" : "s"}</p><div className="account-orders">{orders.map((order) => <article className="account-panel" key={order.id}>
      <div className="account-order-heading"><div><h2>{order.order_number}</h2><p>{orderDate(order.created_at)}</p></div><strong>{money(order.total_amount)}</strong></div>
      <p>{order.order_items.map((item) => `${item.product_name} × ${item.quantity}`).join(" · ")}</p>
      <div className="account-statuses"><span>Payment: {order.payment_status}</span><span>Delivery: {order.fulfilment_status === "unfulfilled" ? "Not yet dispatched" : order.fulfilment_status}</span></div>
      <div className="account-actions"><Link className="button" href={`/account/orders/${order.id}`}>View order & delivery</Link>{order.payment_status === "paid" ? <Link href={`/account/orders/${order.id}/receipt`}>View receipt</Link> : null}</div>
    </article>)}</div></> : <section className="account-panel"><h2>{page > 1 ? "No orders on this page" : "Your order history starts here"}</h2><p>{page > 1 ? "Return to the first page to see your purchases." : "Place an order while signed in and it will appear here with its payment and delivery status."}</p>{page > 1 ? <Link href="/account">First page</Link> : <Link href="/products">Explore the shop</Link>}</section>}
    <nav className="account-actions" aria-label="Order history pages">{page > 1 ? <Link href={`/account?page=${page - 1}`}>Previous</Link> : null}{page * size < total ? <Link href={`/account?page=${page + 1}`}>Next</Link> : null}</nav>
  </div>;
}
