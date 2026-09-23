"use client";

import { Percent, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { money } from "@/lib/products";
import type { CouponCode } from "@/lib/commerce-types";

const blankCoupon: CouponCode = {
  id: "",
  code: "",
  type: "percentage",
  value: 10,
  min_spend: 0,
  is_active: true,
  times_used: 0,
};

export function AdminCouponsEditor() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CouponCode | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load coupon codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.type.toLowerCase().includes(query.toLowerCase())
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.code.trim()) return toast.error("Please provide a coupon code");
    if (!editing.value || Number(editing.value) <= 0) return toast.error("Please provide a valid discount value");

    setSaving(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          code: editing.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editing.id ? "Coupon updated." : "Coupon created.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Coupon deleted.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  }

  return (
    <div className="admin-catalogue">
      <div className="admin-catalogue-toolbar">
        <label className="admin-catalogue-search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coupon code or type"
          />
        </label>
        <button
          className="button"
          type="button"
          onClick={() => setEditing({ ...blankCoupon, id: `coupon-${Date.now()}` })}
        >
          <Plus /> Add coupon code
        </button>
      </div>

      <div className="admin-stock-summary">
        <strong>{coupons.length}</strong>
        <span>Coupon Codes</span>
        <strong>{coupons.filter((c) => c.is_active).length}</strong>
        <span>Active Coupons</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {filtered.map((coupon) => (
          <div
            key={coupon.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    background: "#0a0a0a",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                  }}
                >
                  <Tag size={14} /> {coupon.code}
                </span>

                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "700",
                    background: coupon.is_active ? "#e6f4ea" : "#f1f3f4",
                    color: coupon.is_active ? "#137333" : "#5f6368",
                  }}
                >
                  {coupon.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div style={{ margin: "16px 0 10px" }}>
                <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#777", fontWeight: "700" }}>
                  Discount Function
                </span>
                <p style={{ fontSize: "20px", fontWeight: "800", margin: "4px 0", color: "#111" }}>
                  {coupon.type === "percentage" ? `${coupon.value}% Off Total` : `${money(coupon.value)} Cashback / Deduction`}
                </p>
              </div>

              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 16px" }}>
                {coupon.min_spend ? `Minimum spend: ${money(coupon.min_spend)}` : "No minimum spend required"}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
              <span style={{ fontSize: "12px", color: "#888" }}>
                Used: <strong>{coupon.times_used || 0} times</strong>
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="button"
                  style={{ padding: "6px 14px", fontSize: "13px", height: "auto" }}
                  onClick={() => setEditing(structuredClone(coupon))}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-delete-button"
                  style={{ padding: "6px 10px", margin: 0, height: "auto" }}
                  onClick={() => handleDelete(coupon.id, coupon.code)}
                  aria-label="Delete coupon"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="admin-edit-modal" role="dialog" aria-modal="true">
          <form className="admin-edit-card" onSubmit={handleSave} style={{ maxWidth: "560px" }}>
            <button type="button" className="admin-edit-close" onClick={() => setEditing(null)}>
              <X />
            </button>
            <p className="eyebrow">{editing.id.startsWith("coupon-") && !coupons.some(c => c.id === editing.id) ? "NEW COUPON CODE" : "EDIT COUPON CODE"}</p>
            <h2>{editing.id.startsWith("coupon-") && !coupons.some(c => c.id === editing.id) ? "Add Coupon Code" : editing.code}</h2>

            <div className="form-grid" style={{ marginTop: "20px" }}>
              <label className="field full">
                <span>Coupon Code</span>
                <input
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FITS10, WELCOME2000"
                  required
                />
              </label>

              <label className="field">
                <span>Discount Function</span>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as "percentage" | "fixed" })}
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Cashback / Fixed Deduction (NGN)</option>
                </select>
              </label>

              <label className="field">
                <span>{editing.type === "percentage" ? "Discount Percentage (%)" : "Deduction Amount (NGN)"}</span>
                <input
                  type="number"
                  min={1}
                  max={editing.type === "percentage" ? 100 : undefined}
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                  required
                />
              </label>

              <label className="field full">
                <span>Minimum Order Spend (NGN, optional)</span>
                <input
                  type="number"
                  min={0}
                  value={editing.min_spend || ""}
                  onChange={(e) => setEditing({ ...editing, min_spend: Number(e.target.value) })}
                  placeholder="0 for no minimum"
                />
              </label>

              <label className="admin-check full" style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <strong>Active Coupon Code</strong>
              </label>
            </div>

            <div className="admin-modal-actions" style={{ marginTop: "24px" }}>
              <button className="button" disabled={saving}>
                {saving ? "Saving…" : "Save coupon code"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
