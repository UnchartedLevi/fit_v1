"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./cart-provider";

function checkIsShopSubdomain(): boolean {
  if (typeof window === "undefined") return false;
  const host = (window.location.hostname || "").toLowerCase();
  const search = window.location.search || "";
  return (
    host === "shop.fits4l.xyz" ||
    host === "shop.localhost" ||
    host.startsWith("shop.") ||
    search.includes("subdomain=shop") ||
    document.documentElement.classList.contains("is-shop-subdomain")
  );
}

function HeaderSearch({ variant = "inline" }: { variant?: "inline" | "centered" }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [term, setTerm] = useState(searchParams?.get("q") || "");

  const isShopPage =
    pathname === "/products" ||
    (typeof window !== "undefined" && checkIsShopSubdomain() && pathname === "/") ||
    (typeof document !== "undefined" && !!document.getElementById("products"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerm(val);

    if (isShopPage) {
      window.dispatchEvent(new CustomEvent("fits:search", { detail: val }));
      const url = new URL(window.location.href);
      if (val) url.searchParams.set("q", val);
      else url.searchParams.delete("q");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShopPage) {
      const isShopSub = checkIsShopSubdomain();
      const target = isShopSub
        ? `/?q=${encodeURIComponent(term)}`
        : `/products?q=${encodeURIComponent(term)}`;
      router.push(target);
    }
  };

  const handleClear = () => {
    setTerm("");
    if (isShopPage) {
      window.dispatchEvent(new CustomEvent("fits:search", { detail: "" }));
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const isCentered = variant === "centered";

  return (
    <form
      onSubmit={handleSubmit}
      className={`nav-search-form ${isCentered ? "is-centered" : ""}`}
      role="search"
    >
      <div className={`nav-search-box ${isCentered ? "is-centered" : ""}`}>
        <Search size={isCentered ? 16 : 15} className="nav-search-icon" />
        <input
          type="search"
          value={term}
          onChange={handleChange}
          placeholder="Search products..."
          aria-label="Search products"
          className={`nav-search-input ${isCentered ? "is-centered" : ""}`}
        />
        {term ? (
          <button
            type="button"
            onClick={handleClear}
            className="nav-search-clear"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function SiteHeader({ initialIsShopSubdomain = false }: { initialIsShopSubdomain?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { count } = useCart();

  const isShop = initialIsShopSubdomain || pathname === "/products" || pathname.startsWith("/products/");

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
    <header className={`site-header ${isShop ? "is-shop" : ""}`}>
      <Link href="/" className="brand-logo" aria-label="FITS home">
        <Image src="/brand/fits-logo-black.png" alt="FITS" width={557} height={296} priority />
      </Link>

      {!isShop ? (
        <nav className={`nav ${open ? "open" : ""}`}>
          <Link className="nav-wordmark" href="/products" onClick={() => setOpen(false)}>Shop</Link>
          <Link className="nav-spotlight" href="/spotlight" onClick={() => setOpen(false)}><span>Sport</span><span>light</span></Link>
          <Link className="nav-wordmark" href="/about" onClick={() => setOpen(false)}>Our Journey</Link>
          {isAdmin === true ? <Link className="admin-portal-button" href="/admin" onClick={() => setOpen(false)}>Admin portal</Link> : null}
        </nav>
      ) : null}

      {isShop ? (
        <div className="header-center-search">
          <Suspense fallback={<div className="nav-search-box-skeleton center-search-skeleton" />}>
            <HeaderSearch variant="centered" />
          </Suspense>
        </div>
      ) : null}

      <div className="header-actions">
        {!isShop ? (
          <div className="header-action-search">
            <Suspense fallback={<div className="nav-search-box-skeleton" />}>
              <HeaderSearch variant="inline" />
            </Suspense>
          </div>
        ) : null}

        {isAdmin === true && isShop ? (
          <Link className="admin-portal-button admin-portal-subdomain" href="/admin">
            Admin
          </Link>
        ) : null}

        {email ? (
          <>
            <Link href="/account" className="account-initial" aria-label={`My account and orders, signed in as ${email}`}>{email[0]?.toUpperCase()}</Link>
            <button className="logout-button" type="button" onClick={logout} aria-label="Log out"><LogOut /></button>
          </>
        ) : (
          <Link href="/auth/login" aria-label="Account"><UserRound /></Link>
        )}
        <Link href="/cart" className="bag" aria-label={`Bag, ${count} items`}><ShoppingBag /><b>{count}</b></Link>
        {!isShop ? (
          <button onClick={() => setOpen(!open)} className="menu" aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        ) : null}
      </div>
    </header>
  );
}
