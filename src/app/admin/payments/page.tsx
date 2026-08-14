import { AdminPaymentsReport, type AdminPaymentRow } from "@/components/admin-payments-report";
import { requireAdmin } from "@/lib/auth";

type RawPayment = Omit<AdminPaymentRow, "order"> & {
  order: AdminPaymentRow["order"] | AdminPaymentRow["order"][];
};

export default async function PaymentsPage() {
  const auth = await requireAdmin();
  const { data, error } = await auth.supabase
    .from("payments")
    .select("id,provider_reference,amount,currency,status,channel,gateway_response,paid_at,verified_at,created_at,order:orders!payments_order_id_fkey(order_number,customer_email,customer_phone,delivery_address_snapshot)")
    .order("created_at", { ascending: false });

  const payments = ((data ?? []) as unknown as RawPayment[]).map((payment) => ({
    ...payment,
    order: Array.isArray(payment.order) ? payment.order[0] ?? null : payment.order,
  }));

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <div>
          <span className="eyebrow">CUSTOMER PAYMENTS</span>
          <h1>Payments</h1>
          <p>Track each Paystack payment and monthly income directly from customer orders.</p>
        </div>
        <div className="admin-chip">Paystack records</div>
      </section>

      <section className="admin-panel admin-panel--wide">
        <div className="admin-panel__head">
          <h2>Payment report</h2>
          <p>Only verified paid transactions count toward income. Pending and failed attempts remain visible for reconciliation.</p>
        </div>
        {error ? <div className="admin-error">Could not load payments: {error.message}</div> : <AdminPaymentsReport initialPayments={payments} />}
      </section>
    </div>
  );
}
