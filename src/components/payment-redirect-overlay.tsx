"use client";

import { useEffect } from "react";
import { LockKeyhole } from "lucide-react";

export function PaymentRedirectOverlay() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="payment-overlay" role="status" aria-live="polite" aria-atomic="true">
      <div className="payment-modal">
        <span className="payment-spinner" aria-hidden="true" />
        <p className="eyebrow"><LockKeyhole size={14} aria-hidden="true" /> SECURE PAYMENT</p>
        <h2>Redirecting to Paystack…</h2>
        <p>We’re preparing your checkout. You’ll complete your payment securely on Paystack.</p>
        <small>Please keep this window open. Don’t click Pay again.</small>
      </div>
    </div>
  );
}
