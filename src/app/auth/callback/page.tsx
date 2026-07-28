"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState(() =>
    supabase ? "Confirming your FITS account…" : "Authentication is not configured on this site.",
  );

  useEffect(() => {
    if (!supabase) return;

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      setMessage("Your account is confirmed. Taking you to FITS…");
      router.replace("/");
      router.refresh();
    };

    const completeSignIn = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("This confirmation link is invalid or has expired. Sign in and request a new link when email delivery is available.");
          return;
        }
        finish();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) finish();
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish();
    });

    void completeSignIn();
    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <div className="page-shell">
      <span className="eyebrow">FITS ACCOUNT</span>
      <h1 className="page-title">{message}</h1>
      <Link className="button" href="/auth/login">Back to sign in</Link>
    </div>
  );
}
