"use client";

import { Check, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";

function Result() {
  const query = useSearchParams();
  const router = useRouter();
  const { clear } = useCart();
  const [result, setResult] = useState<{ state: "loading" | "success" | "error"; message: string }>({ state: "loading", message: "Verifying your payment…" });

  useEffect(() => {
    const reference = query.get("reference") || query.get("trxref");
    const task = reference
      ? fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`).then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error);
          clear();
          setResult({ state: "success", message: "Payment successful. Your order is confirmed." });
          window.setTimeout(() => router.replace(`/products?payment_success=true&reference=${encodeURIComponent(reference)}`), 2000);
        })
      : Promise.reject(new Error("Payment reference missing."));
    task.catch((error) => setResult({ state: "error", message: error instanceof Error ? error.message : "Payment verification failed." }));
  }, [clear, query, router]);

  return <div className="payment-result-page"><div className={`payment-result payment-result--${result.state}`}>{result.state === "loading" ? <span className="payment-spinner" /> : result.state === "success" ? <Check /> : <X />}<p className="eyebrow">ORDER STATUS</p><h1>{result.message}</h1><p>{result.state === "success" ? "Redirecting to store..." : result.state === "loading" ? "Please keep this window open." : "Your cart is still safe. You can return to checkout and try again."}</p>{result.state === "success" ? <button className="button" onClick={() => router.push("/products?payment_success=true")}>View store & follow FITS</button> : result.state === "error" ? <button className="button" onClick={() => router.push("/checkout")}>Return to checkout</button> : null}</div></div>;
}

export default function Callback() { return <Suspense fallback={<div className="payment-result-page"><span className="payment-spinner" /></div>}><Result /></Suspense>; }
