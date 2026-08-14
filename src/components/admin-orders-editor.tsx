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
  delivery_address_snapshot?: {
    recipient_name?: string;
    address_line_1?: string;
    delivery_instructions?: string;
  };
};

const fulfilmentOptions: { value: FulfilmentStatus; label: string }[] = [
  { value: "unfulfilled", label: "Needs fulfilment" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped / out for delivery" },
  { value: "delivered", label: "Delivered (fulfilled)" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminOrdersEditor({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "fulfilled">("open");
  const [savingId, setSavingId] = useState<string | null>(null);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalizedQuery || [
        order.order_number,
        order.customer_email,
        order.customer_phone,
        order.delivery_address_snapshot?.recipient_name,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesFilter = filter === "all"
        || (filter === "fulfilled" && order.fulfilment_status === "delivered")
        || (filter === "open" && !["delivered", "cancelled"].includes(order.fulfilment_status));
      return matchesQuery && matchesFilter;
    });
  }, [filter, orders, query]);

  async function updateFulfilment(order: AdminOrder, fulfilmentStatus: FulfilmentStatus) {
    setSavingId(order.id);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfilment_status: fulfilmentStatus }),
      });
      const payload = (await response.json()) as { order?: AdminOrder; error?: string };
      if (!response.ok || !payload.order) throw new Error(payload.error || "Could not update this order.");
      setOrders((current) => current.map((item) => item.id === order.id ? payload.order! : item));
      toast.success(fulfilmentStatus === "delivered" ? `${order.order_number} marked fulfilled` : `${order.order_number} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this order.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-orders-editor">
      <div className="admin-orders-toolbar">
        <label className="admin-field admin-order-search">
          <span>Search orders</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order number, customer, email…" />
        </label>
        <div className="admin-order-filters" role="group" aria-label="Filter orders">
          {(["open", "fulfilled", "all"] as const).map((value) => (
            <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
              {value === "open" ? "Open" : value === "fulfilled" ? "Fulfilled" : "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer & delivery</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfilment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.length ? visibleOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.order_number}</strong>
                  <small className="admin-table-meta">Order: {order.status.replaceAll("_", " ")}</small>
                </td>
                <td>
                  <strong>{order.delivery_address_snapshot?.recipient_name ?? "Customer"}</strong>
                  <small className="admin-table-meta">{order.customer_email}</small>
                  <small className="admin-table-meta">{order.customer_phone}</small>
                  <small className="admin-table-meta">{order.delivery_address_snapshot?.address_line_1 ?? "No address supplied"}</small>
                </td>
                <td><strong>{money(order.total_amount)}</strong></td>
                <td><span className={`badge badge--${order.payment_status}`}>{order.payment_status}</span></td>
                <td>
                  <label className="admin-field admin-fulfilment-field">
                    <span>Status</span>
                    <select
                      value={order.fulfilment_status}
                      disabled={savingId === order.id || order.payment_status !== "paid"}
                      onChange={(event) => void updateFulfilment(order, event.target.value as FulfilmentStatus)}
                    >
                      {fulfilmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  {savingId === order.id ? <small className="admin-table-meta">Saving…</small> : null}
                  {order.fulfilled_at ? <small className="admin-table-meta">Completed {new Date(order.fulfilled_at).toLocaleDateString("en-NG")}</small> : null}
                  {order.payment_status !== "paid" ? <small className="admin-table-meta">Available after verified payment</small> : null}
                </td>
                <td>{new Date(order.created_at).toLocaleDateString("en-NG")}</td>
              </tr>
            )) : <tr><td colSpan={6}>No orders match this view.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
