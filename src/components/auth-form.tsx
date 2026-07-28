"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return toast.error("Add Supabase variables to .env.local");

    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo, data: { full_name: form.get("name") } },
          });

    setBusy(false);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate limit")) {
        return toast.error("Email delivery is temporarily limited. Please wait before trying again and use only the newest confirmation email.");
      }
      if (message.includes("email not confirmed")) {
        return toast.error("This account exists but is not confirmed. Open the newest confirmation email once it arrives.");
      }
      return toast.error(error.message);
    }

    toast.success(mode === "login" ? "Welcome back" : "Check your email to confirm your account");
    router.push(mode === "login" ? next : "/auth/login");
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="eyebrow">FITS ACCOUNT</span>
      <h1>{mode === "login" ? "Sign in" : "Join FITS"}</h1>
      {mode === "signup" && (
        <label className="field">
          <span>Full name</span>
          <input name="name" required />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" name="password" minLength={8} required />
      </label>
      <button className="add-button" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="auth-note">
        {mode === "login" ? (
          <>
            New here? <Link href="/auth/signup">Create an account</Link>
          </>
        ) : (
          <>
            Already registered? <Link href="/auth/login">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
