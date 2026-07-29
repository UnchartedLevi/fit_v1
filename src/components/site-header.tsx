"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart-provider";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { count } = useCart();

  const checkSession = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setIsAdmin(false);
      setEmail(null);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsAdmin(false);
      setEmail(null);
      return;
    }

    setEmail(user.email ?? null);
    const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (error) {
      console.error("Unable to resolve the current user's role", error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(data?.role === "admin");
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase?.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    window.location.href = "/";
  };

  useEffect(() => {
    const supabase = createClient();
    const timer = window.setTimeout(() => {
      void checkSession();
    }, 0);
    const subscription = supabase?.auth.onAuthStateChange(() => {
      void checkSession();
    }).data.subscription;

    return () => {
      window.clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [checkSession]);

  return (
    <header className="site-header">
      <Link href="/" className="brand-logo" aria-label="FITS home">
        <Image src="/brand/fits-logo-black.png" alt="FITS" width={557} height={296} priority />
      </Link>
      <nav className={open ? "nav open" : "nav"}>
        <Link className="nav-wordmark" href="/products">Shop</Link>
        <Link className="nav-spotlight" href="/spotlight"><span>Sport</span><span>light</span></Link>
        <Link className="nav-wordmark" href="/about">Our Journey</Link>
        {isAdmin === true ? <Link className="admin-portal-button" href="/admin">Admin portal</Link> : null}
      </nav>
      <div className="header-actions">
        <Link href="/products" aria-label="Search"><Search /></Link>
        {email ? (
          <>
            <Link href="/auth/login" className="account-initial" aria-label={`Signed in as ${email}`}>{email[0]?.toUpperCase()}</Link>
            <button className="logout-button" type="button" onClick={logout} aria-label="Log out"><LogOut /></button>
          </>
        ) : (
          <Link href="/auth/login" aria-label="Account"><UserRound /></Link>
        )}
        <Link href="/cart" className="bag" aria-label={`Bag, ${count} items`}><ShoppingBag /><b>{count}</b></Link>
        <button onClick={() => setOpen(!open)} className="menu" aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
