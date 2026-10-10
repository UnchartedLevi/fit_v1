import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerOrder } from "@/lib/customer-orders";
import { CustomerOrderSummary } from "@/components/customer-order-summary";
import { PrintReceiptButton } from "@/components/print-receipt-button";

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getCustomerOrder(id, true);
  if (!order || order.payment_status !== "paid") notFound();
  return <div className="page-shell account-page receipt-page"><div className="account-heading receipt-controls"><Link href={`/account/orders/${id}`}>← Order details</Link><PrintReceiptButton /></div><CustomerOrderSummary order={order} /><p className="receipt-controls">Choose “Save as PDF” in your browser’s print options to keep a copy.</p></div>;
}
