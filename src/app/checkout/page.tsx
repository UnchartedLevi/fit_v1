"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Check, Clock, Tag, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/products";
import { toast } from "sonner";
import type { ShippingMethod } from "@/lib/commerce-types";

const CHECKOUT_DETAILS_KEY = "fits-checkout-details";

type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type AppliedCoupon = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discount: number;
  message: string;
};

export default function Checkout() {
  const { items, subtotal } = useCart();
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<CheckoutDetails>({ name: "", email: "", phone: "", address: "" });

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(true);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(CHECKOUT_DETAILS_KEY) || "{}") as Partial<CheckoutDetails>;
        setDetails((current) => ({ ...current, ...stored }));
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch shipping methods
  useEffect(() => {
    async function loadShipping() {
      try {
        setLoadingShipping(true);
        const res = await fetch("/api/shipping");
        const data = await res.json();
        if (data.methods && Array.isArray(data.methods)) {
          setShippingMethods(data.methods);
        }
      } catch (err) {
        console.error("Failed to load shipping methods", err);
      } finally {
        setLoadingShipping(false);
      }
    }
    loadShipping();
  }, []);

  function updateDetails(field: keyof CheckoutDetails, value: string) {
    const next = { ...details, [field]: value };
    setDetails(next);
    window.localStorage.setItem(CHECKOUT_DETAILS_KEY, JSON.stringify(next));
  }

  async function handleApplyCoupon(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!couponCodeInput.trim()) return toast.error("Please enter a coupon code");
    if (!items.length) return toast.error("Your bag is empty");

    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim().toUpperCase(),
          items: items.map((i) => ({
            product: i.product,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate coupon");

      setAppliedCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        discount: data.discount,
        message: data.message,
      });
      toast.success(data.message || `Coupon ${data.code} applied!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    toast.info("Coupon removed");
  }

  const shippingPrice = selectedShipping ? selectedShipping.price : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal + shippingPrice - discountAmount);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return toast.error("Your bag is empty");

    // Strictly enforce shipping method selection
    if (!selectedShipping) {
      return toast.error("Please select a shipping method to proceed.");
    }

    setBusy(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: Object.fromEntries(form),
          items: items.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
          shipping: {
            id: selectedShipping.id,
            zone_name: selectedShipping.zone_name,
            price: selectedShipping.price,
            eta: selectedShipping.eta,
          },
          coupon: appliedCoupon
            ? {
                code: appliedCoupon.code,
                discount: appliedCoupon.discount,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.authorization_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      {busy ? (
        <div className="payment-overlay" role="status" aria-live="polite">
          <div className="payment-modal">
            <span className="payment-spinner" />
            <p className="eyebrow">PAYSTACK SECURE CHECKOUT</p>
            <h2>Transferring to payment gateway</h2>
            <p>Please keep this window open while we prepare your secure payment.</p>
          </div>
        </div>
      ) : null}

      <span className="eyebrow">GUEST CHECKOUT AVAILABLE</span>
      <h1 className="page-title">CHECKOUT</h1>

      <div className="checkout-grid">
        <form onSubmit={submit}>
          <p className="checkout-note">
            No account needed. We will use these details to process payment and coordinate delivery.
          </p>

          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                name="name"
                required
                value={details.name}
                onChange={(event) => updateDetails("name", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                value={details.email}
                onChange={(event) => updateDetails("email", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                name="phone"
                required
                value={details.phone}
                onChange={(event) => updateDetails("phone", event.target.value)}
              />
            </label>
            <label className="field full">
              <span>Delivery address</span>
              <textarea
                name="address"
                required
                minLength={8}
                rows={3}
                placeholder="Input Address"
                value={details.address}
                onChange={(event) => updateDetails("address", event.target.value)}
              />
              <small>
                <b>Note:</b> Covenant students should include hall and room number. Example: Peter Hall, Room B205.
              </small>
            </label>
          </div>

          {/* Shipping Method Section */}
          <div style={{ marginTop: "32px", borderTop: "1px solid #333", paddingTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Truck size={18} color="#aaa" />
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>Shipping Method</h2>
              <span style={{ fontSize: "12px", color: "#e63946", fontWeight: "700" }}>*Required</span>
            </div>

            {loadingShipping ? (
              <p style={{ color: "#888", fontSize: "14px" }}>Loading shipping methods…</p>
            ) : shippingMethods.length === 0 ? (
              <p style={{ color: "#aaa" }}>No delivery methods currently available.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {shippingMethods.map((method) => {
                  const isSelected = selectedShipping?.id === method.id;
                  return (
                    <label
                      key={method.id}
                      onClick={() => setSelectedShipping(method)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 18px",
                        background: isSelected ? "rgba(255,255,255,0.08)" : "#141414",
                        border: isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input
                          type="radio"
                          name="shipping_method_selection"
                          checked={isSelected}
                          onChange={() => setSelectedShipping(method)}
                          style={{ accentColor: "#fff", width: "18px", height: "18px", cursor: "pointer" }}
                        />
                        <div>
                          <strong style={{ fontSize: "15px", display: "block", color: "#fff" }}>
                            {method.zone_name}
                          </strong>
                          {method.description ? (
                            <span style={{ fontSize: "13px", color: "#888", display: "block" }}>
                              {method.description}
                            </span>
                          ) : null}
                          <span style={{ fontSize: "12px", color: "#aaa", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Clock size={12} /> {method.eta}
                          </span>
                        </div>
                      </div>

                      <strong style={{ fontSize: "16px", color: "#fff" }}>{money(method.price)}</strong>
                    </label>
                  );
                })}
              </div>
            )}

            {!selectedShipping && (
              <p style={{ fontSize: "13px", color: "#f87171", marginTop: "10px" }}>
                Please select a shipping method above to proceed to payment.
              </p>
            )}
          </div>

          {/* Coupon Code Section */}
          <div style={{ marginTop: "32px", borderTop: "1px solid #333", paddingTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Tag size={18} color="#aaa" />
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>Coupon Code</h2>
            </div>

            {appliedCoupon ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  borderRadius: "8px",
                  color: "#22c55e",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={18} />
                  <div>
                    <strong style={{ fontSize: "14px" }}>{appliedCoupon.code}</strong>
                    <span style={{ fontSize: "12px", display: "block", color: "#86efac" }}>
                      {appliedCoupon.message} ({money(appliedCoupon.discount)} saved)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Enter discount / coupon code"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    background: "#161616",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={validatingCoupon || !couponCodeInput.trim()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {validatingCoupon ? "Validating…" : "Apply Code"}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || !items.length || !selectedShipping}
            className="add-button"
            style={{
              marginTop: 32,
              opacity: !selectedShipping ? 0.6 : 1,
              cursor: !selectedShipping ? "not-allowed" : "pointer",
            }}
          >
            {busy
              ? "Preparing payment..."
              : !selectedShipping
              ? "Select a shipping method to proceed"
              : `Pay ${money(finalTotal)} with Paystack`}
          </button>

          <p className="checkout-note secondary">
            Want order history later? <Link href="/auth/signup">Create an account</Link> after checkout or sign in before your next order.
          </p>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>
          {items.map((item) => (
            <div className="summary-row" key={`${item.product.id}-${item.variantId}`}>
              <span>
                {item.product.name} x {item.quantity}
                <small style={{ display: "block" }}>{item.option}</small>
              </span>
              <b>{money(item.unitPrice * item.quantity)}</b>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "20px", paddingTop: "14px" }}>
            <div className="summary-row" style={{ color: "#aaa" }}>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="summary-row" style={{ color: "#aaa", marginTop: "8px" }}>
              <span>Shipping</span>
              <span>
                {selectedShipping ? money(selectedShipping.price) : <em style={{ fontSize: "12px", color: "#f87171" }}>Select shipping</em>}
              </span>
            </div>

            {appliedCoupon ? (
              <div className="summary-row" style={{ color: "#22c55e", fontWeight: "700", marginTop: "8px" }}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span>- {money(discountAmount)}</span>
              </div>
            ) : null}

            <div className="total-line" style={{ marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "14px" }}>
              <span>Total</span>
              <b>{money(finalTotal)}</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
