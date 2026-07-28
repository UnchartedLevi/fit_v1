"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, Package, ShoppingBag, Store } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__mark">F</div>
          <div>
            <p className="eyebrow">OPERATIONS</p>
            <h2>FITS Manager</h2>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className={`admin-nav-item${isActive ? " active" : ""}`}>
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

