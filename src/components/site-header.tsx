"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart-provider";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { count } = useCart();

  const checkAdmin = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setIsAdmin(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setIsAdmin(data?.role === "admin");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const timer = window.setTimeout(() => {
      void checkAdmin();
    }, 0);
    const subscription = supabase?.auth.onAuthStateChange(() => {
      void checkAdmin();
    }).data.subscription;

    return () => {
      window.clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, [checkAdmin]);

  return (
    <header className="site-header">
      <Link href="/" className="brand-logo" aria-label="FITS home">
        <Image src="/brand/fits-logo-black.png" alt="FITS" width={557} height={296} priority />
      </Link>
      <nav className={open ? "nav open" : "nav"}>
        <Link className="nav-wordmark" href="/products">Shop</Link>
        <Link className="nav-spotlight" href="/spotlight"><span>Sport</span><span>light</span></Link>
        <Link className="nav-wordmark" href="/about">Our Journey</Link>
        {isAdmin ? <Link className="admin-portal-button" href="/admin">Admin portal</Link> : null}
      </nav>
      <div className="header-actions">
        <Link href="/products" aria-label="Search"><Search /></Link>
        <Link href="/auth/login" aria-label="Account"><UserRound /></Link>
        <Link href="/cart" className="bag" aria-label={`Bag, ${count} items`}><ShoppingBag /><b>{count}</b></Link>
        <button onClick={() => setOpen(!open)} className="menu" aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
