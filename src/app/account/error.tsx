"use client";
import Link from "next/link";
export default function AccountError({ reset }: { reset: () => void }) { return <div className="page-shell account-page"><h1>We couldn’t load your orders</h1><p>Your account data is safe. Please try again.</p><div className="account-actions"><button type="button" className="button" onClick={reset}>Try again</button><Link href="/products">Return to shop</Link></div></div>; }
