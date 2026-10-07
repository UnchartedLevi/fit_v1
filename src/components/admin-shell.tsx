"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, CreditCard, LayoutDashboard, Menu, Package, ShoppingBag, Store, Tag, Truck, X } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/coupon-codes", label: "Coupon Codes", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <div className="admin-sidebar__heading">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__mark">F</div>
          <div>
            <p className="eyebrow">OPERATIONS</p>
            <h2>FITS Manager</h2>
          </div>
        </div>
        <button type="button" className="admin-sidebar__toggle"
          aria-expanded={menuOpen} aria-controls="admin-sidebar-content"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        </div>

        <div id="admin-sidebar-content" className="admin-sidebar__content">
        <nav className="admin-nav" aria-label="Admin sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`admin-nav-item${isActive ? " active" : ""}`}>
                <Icon size={16} />
                <span>{item.label}</span>
                {isActive ? <span className="admin-nav-pill">Live</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__footer-card">
            <Store size={16} />
            <p>Keep stock, pricing and fulfilment aligned with the storefront.</p>
          </div>
          <Link href="/" className="admin-sidebar__link">
            View storefront
            <ArrowUpRight size={16} />
          </Link>
        </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">ADMIN PORTAL</p>
            <h1>Store operations</h1>
          </div>
          <Link href="/" className="admin-header__action">
            Preview store
          </Link>
        </header>

        <div className="admin-page-content">{children}</div>
      </main>
    </div>
  );
}
