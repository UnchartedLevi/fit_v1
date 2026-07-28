"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/products";
import { toast } from "sonner";

const CHECKOUT_DETAILS_KEY = "fits-checkout-details";

type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export default function Checkout() {
  const { items, subtotal } = useCart();
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<CheckoutDetails>({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(CHECKOUT_DETAILS_KEY) || "{}") as Partial<CheckoutDetails>;
        setDetails((current) => ({ ...current, ...stored }));
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateDetails(field: keyof CheckoutDetails, value: string) {
    const next = { ...details, [field]: value };
    setDetails(next);
    window.localStorage.setItem(CHECKOUT_DETAILS_KEY, JSON.stringify(next));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return toast.error("Your bag is empty");
    setBusy(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: Object.fromEntries(form),
          items: items.map((item) => ({ product_id: item.product.id, size: item.size, quantity: item.quantity })),
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
      <span className="eyebrow">GUEST CHECKOUT AVAILABLE</span>
      <h1 className="page-title">DELIVERY DETAILS</h1>
      <div className="checkout-grid">
        <form onSubmit={submit}>
          <p className="checkout-note">No account needed. We will use these details only to process payment and deliver your order on campus.</p>
          <div className="form-grid">
            <label className="field"><span>Full name</span><input name="name" required value={details.name} onChange={(event) => updateDetails("name", event.target.value)} /></label>
            <label className="field"><span>Email</span><input type="email" name="email" required value={details.email} onChange={(event) => updateDetails("email", event.target.value)} /></label>
            <label className="field"><span>Phone</span><input name="phone" required value={details.phone} onChange={(event) => updateDetails("phone", event.target.value)} /></label>
            <label className="field full">
              <span>Delivery address</span>
              <textarea name="address" required minLength={8} rows={4} placeholder="Input Address" value={details.address} onChange={(event) => updateDetails("address", event.target.value)} />
              <small> <b>Note:</b> Covenant students should include hall and room number. Example: Peter Hall, Room B205.</small>
            </label>
          </div>
          <button disabled={busy || !items.length} className="add-button" style={{ marginTop: 25 }}>{busy ? "Preparing payment..." : `Pay ${money(subtotal)} with Paystack`}</button>
          <p className="checkout-note secondary">Want order history later? <Link href="/auth/signup">Create an account</Link> after checkout or sign in before your next order.</p>
        </form>
        <aside className="summary">
          <h2>Order summary</h2>
          {items.map((item) => <div className="summary-row" key={`${item.product.id}-${item.size}`}><span>{item.product.name} x {item.quantity}<small style={{ display: "block" }}>Size {item.size}</small></span><b>{money(item.product.price * item.quantity)}</b></div>)}
          <div className="total-line" style={{ marginTop: 25 }}><span>Total</span><b>{money(subtotal)}</b></div>
        </aside>
      </div>
    </div>
  );
}
