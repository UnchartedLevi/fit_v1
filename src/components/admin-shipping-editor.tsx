"use client";

import { Clock, Plus, Search, Trash2, Truck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { money } from "@/lib/products";
import type { ShippingMethod } from "@/lib/commerce-types";

const blankMethod: ShippingMethod = {
  id: "",
  zone_name: "",
  description: "",
  price: 1000,
  eta: "Same day (within 2-4 hours)",
  is_active: true,
  sort_order: 10,
};

export function AdminShippingEditor() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shipping?all=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMethods(data.methods || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load shipping methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = methods.filter(
    (m) =>
      m.zone_name.toLowerCase().includes(query.toLowerCase()) ||
      m.description.toLowerCase().includes(query.toLowerCase()) ||
      m.eta.toLowerCase().includes(query.toLowerCase())
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.zone_name.trim() || !editing.eta.trim()) {
      return toast.error("Please fill in Zone Name and ETA");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editing.id ? "Shipping method updated." : "Shipping method added.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipping method");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete shipping zone "${name}"?`)) return;
    try {
      const res = await fetch(`/api/shipping?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Shipping method deleted.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete shipping method");
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
            placeholder="Search delivery zones or ETA"
          />
        </label>
        <button
          className="button"
          type="button"
          onClick={() => setEditing({ ...blankMethod, id: `zone-${Date.now()}` })}
        >
          <Plus /> Add shipping method
        </button>
      </div>

      <div className="admin-stock-summary">
        <strong>{methods.length}</strong>
        <span>Delivery Zones</span>
        <strong>{methods.filter((m) => m.is_active).length}</strong>
        <span>Active Methods</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {filtered.map((method) => (
          <div
            key={method.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>
                  <Truck size={14} /> Zone
                </span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "700",
                    background: method.is_active ? "#e6f4ea" : "#f1f3f4",
                    color: method.is_active ? "#137333" : "#5f6368",
                  }}
                >
                  {method.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                {method.zone_name}
              </h3>

              <p style={{ fontSize: "14px", color: "#666", margin: "0 0 16px", lineHeight: "1.5" }}>
                {method.description || "No description provided."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#444", marginBottom: "16px" }}>
                <Clock size={15} color="#888" />
                <span>ETA: <strong>{method.eta}</strong></span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "12px" }}>
              <strong style={{ fontSize: "22px", letterSpacing: "-0.03em" }}>{money(method.price)}</strong>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="button"
                  style={{ padding: "6px 14px", fontSize: "13px", height: "auto" }}
                  onClick={() => setEditing(structuredClone(method))}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-delete-button"
                  style={{ padding: "6px 10px", margin: 0, height: "auto" }}
                  onClick={() => handleDelete(method.id, method.zone_name)}
                  aria-label="Delete shipping method"
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
            <p className="eyebrow">{editing.id.startsWith("zone-") && !methods.some(m => m.id === editing.id) ? "NEW SHIPPING METHOD" : "EDIT SHIPPING METHOD"}</p>
            <h2>{editing.id.startsWith("zone-") && !methods.some(m => m.id === editing.id) ? "Add Shipping Method" : editing.zone_name}</h2>

            <div className="form-grid" style={{ marginTop: "20px" }}>
              <label className="field full">
                <span>Zone Name</span>
                <input
                  value={editing.zone_name}
                  onChange={(e) => setEditing({ ...editing, zone_name: e.target.value })}
                  placeholder="e.g. Covenant University Campus, Lagos Mainland"
                  required
                />
              </label>

              <label className="field full">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Direct delivery instructions, coverage area..."
                />
              </label>

              <label className="field">
                <span>Price (NGN)</span>
                <input
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  required
                />
              </label>

              <label className="field">
                <span>Estimated Time of Arrival (ETA)</span>
                <input
                  value={editing.eta}
                  onChange={(e) => setEditing({ ...editing, eta: e.target.value })}
                  placeholder="e.g. Same day (2-4 hours), 1-2 Business Days"
                  required
                />
              </label>

              <label className="admin-check full" style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <strong>Active Delivery Method</strong>
              </label>
            </div>

            <div className="admin-modal-actions" style={{ marginTop: "24px" }}>
              <button className="button" disabled={saving}>
                {saving ? "Saving…" : "Save shipping method"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
