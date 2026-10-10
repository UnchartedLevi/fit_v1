import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerOrder, deliveryProgress } from "@/lib/customer-orders";
import { CustomerOrderSummary } from "@/components/customer-order-summary";
import { AccountRefreshButton } from "@/components/account-refresh-button";

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getCustomerOrder(id);
  if (!order) notFound();
  const progress = deliveryProgress(order);
  return <div className="page-shell account-page">
    <Link href="/account">← My orders</Link><div className="account-heading"><h1>Order details</h1>{order.payment_status === "paid" ? <Link className="button" href={`/account/orders/${order.id}/receipt`}>View / save receipt</Link> : null}</div>
    <section className="account-panel"><h2>Delivery progress</h2><p>{progress.message}</p>{progress.step >= 0 ? <ol className="account-progress">{["Payment confirmed", "Preparing order", "Dispatched", "Delivered"].map((label, index) => <li key={label} className={index <= progress.step ? "is-complete" : ""} aria-current={index === progress.step ? "step" : undefined}><span aria-hidden="true">{index <= progress.step ? "✓" : index + 1}</span>{label}{index === progress.step ? <small>Current status</small> : null}</li>)}</ol> : null}<p>Payment status: <strong>{order.payment_status}</strong></p></section>
    <CustomerOrderSummary order={order} />
    <div className="account-actions"><AccountRefreshButton /></div>
  </div>;
}
