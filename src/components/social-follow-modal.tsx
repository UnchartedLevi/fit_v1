"use client";

import { CheckCircle2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SocialFollowModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment_success") === "true" || searchParams.get("order_success") === "true") {
      setIsOpen(true);
    }
  }, [searchParams]);

  function handleClose() {
    setIsOpen(false);
    // Remove query params smoothly
    const url = new URL(window.location.href);
    url.searchParams.delete("payment_success");
    url.searchParams.delete("order_success");
    url.searchParams.delete("reference");
    url.searchParams.delete("trxref");
    window.history.replaceState({}, "", url.pathname);
  }

  if (!isOpen) return null;

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/fits4l/";
  const xUrl = process.env.NEXT_PUBLIC_X_URL || "https://x.com/fits4l";
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/2347045700851";
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/+2347045700851";

  return (
    <div
      className="payment-overlay"
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 1000 }}
    >
      <div
        className="payment-modal"
        style={{
          maxWidth: "480px",
          textAlign: "center",
          borderRadius: "16px",
          padding: "36px 28px",
          position: "relative",
          background: "#111",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", marginBottom: "16px" }}>
          <CheckCircle2 size={36} />
        </div>

        <p className="eyebrow" style={{ color: "#22c55e", marginBottom: "6px" }}>ORDER CONFIRMED</p>
        <h2 style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "-0.04em", margin: "0 0 12px", color: "#fff" }}>
          YOU’RE IN THE CLUB.
        </h2>

        <p style={{ color: "#aaa", fontSize: "15px", lineHeight: "1.5", margin: "0 0 28px" }}>
          Thank you for your order! Follow <strong>FITS</strong> on social media to catch up with our latest drops, matchday gear, and campus community updates.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 14px",
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Instagram
          </a>

          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 14px",
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X / Twitter
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 14px",
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            <MessageCircle size={18} color="#25D366" />
            WhatsApp
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 14px",
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            <Send size={18} color="#0088cc" />
            Telegram
          </a>
        </div>

        <button
          type="button"
          className="button light-button"
          onClick={handleClose}
          style={{ width: "100%", justifyContent: "center", borderRadius: "10px" }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
