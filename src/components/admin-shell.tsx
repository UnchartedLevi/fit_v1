import Link from "next/link";
export function AdminShell({children}:{children:React.ReactNode}){return <div className="admin-layout"><aside className="admin-side"><b>FITS MANAGER</b><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/admin/orders">Orders</Link><Link href="/">View store</Link></aside><section className="admin-content">{children}</section></div>}

