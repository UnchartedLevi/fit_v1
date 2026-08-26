"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { money } from "@/lib/products";
import type { FulfilmentStatus, OrderStatus, PaymentStatus } from "@/lib/commerce-types";

export type AdminOrder = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  fulfilment_status: FulfilmentStatus;
  created_at: string;
  fulfilled_at: string | null;
  delivery_address_snapshot?: { recipient_name?: string; address_line_1?: string; delivery_instructions?: string; };
};

const fulfilmentOptions: { value: FulfilmentStatus; label: string }[] = [
  { value: "unfulfilled", label: "Paid · not started" }, { value: "processing", label: "Processing" }, { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" },
];

export function AdminOrdersEditor({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "fulfilled">("open");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const visibleOrders = useMemo(() => orders.filter((order) => {
    const q = query.trim().toLowerCase();
    const matches = !q || [order.order_number, order.customer_email, order.customer_phone, order.delivery_address_snapshot?.recipient_name].some((value) => value?.toLowerCase().includes(q));
    const status = filter === "all" || (filter === "fulfilled" && order.fulfilment_status === "delivered") || (filter === "open" && !["delivered", "cancelled"].includes(order.fulfilment_status));
    return matches && status;
  }), [filter, orders, query]);

  async function saveOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/orders/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_email: form.get("customer_email"), customer_phone: form.get("customer_phone"), total_amount: Number(form.get("total_amount")), fulfilment_status: form.get("fulfilment_status"), delivery_address_snapshot: { ...selected.delivery_address_snapshot, recipient_name: form.get("recipient_name"), address_line_1: form.get("address_line_1"), delivery_instructions: form.get("delivery_instructions") } }) });
      const payload = await response.json(); if (!response.ok || !payload.order) throw new Error(payload.error || "Could not update order.");
      setOrders((current) => current.map((order) => order.id === selected.id ? payload.order : order)); setSelected(null); toast.success("Order updated and fulfilment notification sent where applicable.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update order."); } finally { setSaving(false); }
  }

  async function deleteOrder() {
    if (!selected || !window.confirm(`Delete ${selected.order_number}? This cannot be undone.`)) return;
    setSaving(true); try { const response = await fetch(`/api/admin/orders/${selected.id}`, { method: "DELETE" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Could not delete order."); setOrders((current) => current.filter((order) => order.id !== selected.id)); setSelected(null); toast.success("Order deleted."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete order."); } finally { setSaving(false); }
  }

  return <div className="admin-orders-editor">
    <div className="admin-orders-toolbar"><label className="admin-field admin-order-search"><span>Search orders</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order number, customer, email…" /></label><div className="admin-order-filters" role="group" aria-label="Filter orders">{(["open", "fulfilled", "all"] as const).map((value) => <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "open" ? "Open" : value === "fulfilled" ? "Delivered" : "All"}</button>)}</div></div>
    <div className="table-wrap"><table className="admin-orders-table"><thead><tr><th>Order</th><th>Customer & delivery</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Date</th></tr></thead><tbody>{visibleOrders.length ? visibleOrders.map((order) => <tr key={order.id} className={selected?.id === order.id ? "is-selected" : ""} onClick={() => setSelected(order)}><td><strong>{order.order_number}</strong><small className="admin-table-meta">{order.status.replaceAll("_", " ")}</small></td><td><strong>{order.delivery_address_snapshot?.recipient_name ?? "Customer"}</strong><small className="admin-table-meta">{order.customer_email}</small><small className="admin-table-meta">{order.customer_phone}</small><small className="admin-table-meta">{order.delivery_address_snapshot?.address_line_1 ?? "No address supplied"}</small></td><td><strong>{money(order.total_amount)}</strong></td><td><span className={`badge badge--${order.payment_status}`}>{order.payment_status}</span></td><td><span className={`badge badge--${order.fulfilment_status}`}>{order.fulfilment_status}</span>{order.fulfilled_at ? <small className="admin-table-meta">{new Date(order.fulfilled_at).toLocaleDateString("en-NG")}</small> : null}</td><td>{new Date(order.created_at).toLocaleDateString("en-NG")}</td></tr>) : <tr><td colSpan={6}>No orders match this view.</td></tr>}</tbody></table></div>
    {selected ? <div className="admin-edit-modal" role="dialog" aria-modal="true"><form className="admin-edit-card" onSubmit={saveOrder}><button type="button" className="admin-edit-close" onClick={() => setSelected(null)} aria-label="Close">×</button><p className="eyebrow">EDIT ORDER / {selected.order_number}</p><h2>Order details</h2><div className="form-grid"><label className="field"><span>Recipient</span><input name="recipient_name" defaultValue={selected.delivery_address_snapshot?.recipient_name ?? ""} required /></label><label className="field"><span>Email</span><input type="email" name="customer_email" defaultValue={selected.customer_email} required /></label><label className="field"><span>Phone</span><input name="customer_phone" defaultValue={selected.customer_phone} required /></label><label className="field"><span>Total amount</span><input type="number" min={0} name="total_amount" defaultValue={selected.total_amount} required /></label><label className="field full"><span>Address</span><input name="address_line_1" defaultValue={selected.delivery_address_snapshot?.address_line_1 ?? ""} required /></label><label className="field full"><span>Delivery notes</span><textarea name="delivery_instructions" defaultValue={selected.delivery_address_snapshot?.delivery_instructions ?? ""} rows={3} /></label><label className="field full"><span>Fulfilment</span><select name="fulfilment_status" defaultValue={selected.fulfilment_status} disabled={selected.payment_status !== "paid"}>{fulfilmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div><div className="admin-modal-actions"><button className="button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button><button className="admin-delete-button" type="button" onClick={() => void deleteOrder()} disabled={saving}>Delete order</button></div>{selected.payment_status !== "paid" ? <small>Fulfilment changes unlock after Paystack verification.</small> : null}</form></div> : null}
  </div>;
}
