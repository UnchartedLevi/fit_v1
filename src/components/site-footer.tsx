import Link from "next/link";
export function SiteFooter(){return <footer><div><Link href="/" className="logo light">FITS</Link><p>Made for the game. Worn for life.</p></div><div><b>Explore</b><Link href="/products">Shop all</Link><Link href="/products?category=Jerseys">Jerseys</Link><Link href="/auth/login">Account</Link></div><div><b>Follow</b><a href="https://www.instagram.com/fits4l/" target="_blank">Instagram ↗</a><p>Lagos, Nigeria</p></div><small>© {new Date().getFullYear()} FITS. All rights reserved.</small></footer>}

