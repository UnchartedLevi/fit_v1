"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { money } from "@/lib/products";
import type { PaymentStatus } from "@/lib/commerce-types";

export type AdminPaymentRow = {
  id: string;
  provider_reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  channel: string | null;
  gateway_response: string | null;
  paid_at: string | null;
  verified_at: string | null;
  created_at: string;
  order: {
    order_number: string;
    customer_email: string;
    customer_phone: string;
    delivery_address_snapshot?: { recipient_name?: string };
  } | null;
};

function paymentDate(payment: AdminPaymentRow) {
  return new Date(payment.paid_at ?? payment.created_at);
}

function monthKey(payment: AdminPaymentRow) {
  const date = paymentDate(payment);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function AdminPaymentsReport({ initialPayments }: { initialPayments: AdminPaymentRow[] }) {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [query, setQuery] = useState("");

  const monthlyTotals = useMemo(() => {
    const totals = new Map<string, { amount: number; count: number }>();
    initialPayments.filter((payment) => payment.status === "paid").forEach((payment) => {
      const key = monthKey(payment);
      const current = totals.get(key) ?? { amount: 0, count: 0 };
      totals.set(key, { amount: current.amount + payment.amount, count: current.count + 1 });
    });
    return [...totals.entries()].sort(([left], [right]) => right.localeCompare(left));
  }, [initialPayments]);

  const visiblePayments = useMemo(() => {
    const search = query.trim().toLowerCase();
    return initialPayments.filter((payment) => {
      const matchesMonth = selectedMonth === "all" || monthKey(payment) === selectedMonth;
      const matchesStatus = status === "all" || payment.status === status;
      const matchesQuery = !search || [
        payment.provider_reference,
        payment.order?.order_number,
        payment.order?.customer_email,
        payment.order?.customer_phone,
        payment.order?.delivery_address_snapshot?.recipient_name,
      ].some((value) => value?.toLowerCase().includes(search));
      return matchesMonth && matchesStatus && matchesQuery;
    });
  }, [initialPayments, query, selectedMonth, status]);

  const summary = useMemo(() => {
    const paid = visiblePayments.filter((payment) => payment.status === "paid");
    const pending = visiblePayments.filter((payment) => payment.status === "pending");
    const collected = paid.reduce((total, payment) => total + payment.amount, 0);
    return {
      collected,
      paidCount: paid.length,
      pendingAmount: pending.reduce((total, payment) => total + payment.amount, 0),
      average: paid.length ? Math.round(collected / paid.length) : 0,
    };
  }, [visiblePayments]);

  function exportCsv() {
    const headings = ["Date", "Order", "Customer", "Email", "Phone", "Paystack reference", "Amount (NGN)", "Status", "Channel"];
    const rows = visiblePayments.map((payment) => [
      paymentDate(payment).toISOString(),
      payment.order?.order_number,
      payment.order?.delivery_address_snapshot?.recipient_name,
      payment.order?.customer_email,
      payment.order?.customer_phone,
      payment.provider_reference,
      payment.amount,
      payment.status,
      payment.channel,
    ]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fits-payments-${selectedMonth === "all" ? "all" : selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-payments-report">
      <div className="payment-month-grid">
        <button type="button" className={selectedMonth === "all" ? "active" : ""} onClick={() => setSelectedMonth("all")}>
          <span>All time</span>
          <strong>{money(initialPayments.filter((payment) => payment.status === "paid").reduce((total, payment) => total + payment.amount, 0))}</strong>
          <small>{initialPayments.filter((payment) => payment.status === "paid").length} verified payments</small>
        </button>
        {monthlyTotals.slice(0, 5).map(([key, total]) => (
          <button key={key} type="button" className={selectedMonth === key ? "active" : ""} onClick={() => setSelectedMonth(key)}>
            <span>{monthLabel(key)}</span>
            <strong>{money(total.amount)}</strong>
            <small>{total.count} payment{total.count === 1 ? "" : "s"}</small>
          </button>
        ))}
      </div>

      <div className="stat-grid payment-stat-grid">
        <div className="stat"><span className="stat-label">Verified income</span><b>{money(summary.collected)}</b><small>Paystack-confirmed payments</small></div>
        <div className="stat"><span className="stat-label">Paid orders</span><b>{summary.paidCount}</b><small>Individual successful payments</small></div>
        <div className="stat"><span className="stat-label">Pending amount</span><b>{money(summary.pendingAmount)}</b><small>Not counted as income</small></div>
        <div className="stat"><span className="stat-label">Average payment</span><b>{money(summary.average)}</b><small>Across verified payments</small></div>
      </div>

      <div className="admin-payments-toolbar">
        <label className="admin-field admin-payment-search">
          <span>Search payments</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, customer, email or reference…" />
        </label>
        <label className="admin-field admin-payment-filter">
          <span>Payment status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | PaymentStatus)}>
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
        <button className="admin-export-button" type="button" onClick={exportCsv} disabled={!visiblePayments.length}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="admin-payments-table">
          <thead><tr><th>Transaction</th><th>Order & customer</th><th>Amount</th><th>Status</th><th>Channel</th><th>Date</th></tr></thead>
          <tbody>
            {visiblePayments.length ? visiblePayments.map((payment) => (
              <tr key={payment.id}>
                <td><strong>{payment.provider_reference}</strong><small className="admin-table-meta">Paystack</small></td>
                <td>
                  <strong>{payment.order?.order_number ?? "Order unavailable"}</strong>
                  <small className="admin-table-meta">{payment.order?.delivery_address_snapshot?.recipient_name ?? "Customer"}</small>
                  <small className="admin-table-meta">{payment.order?.customer_email}</small>
                </td>
                <td><strong>{money(payment.amount)}</strong></td>
                <td><span className={`badge badge--${payment.status}`}>{payment.status}</span></td>
                <td>{payment.channel ?? "Not supplied"}</td>
                <td>{paymentDate(payment).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</td>
              </tr>
            )) : <tr><td colSpan={6}>No payments match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
