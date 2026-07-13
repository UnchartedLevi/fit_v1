"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";
export function SiteHeader(){
 const [open,setOpen]=useState(false); const {count}=useCart();
 return <header className="site-header"><Link href="/" className="brand-logo" aria-label="FITS home"><Image src="/brand/fits-logo-black.png" alt="FITS" width={557} height={296} priority/></Link>
 <nav className={open?"nav open":"nav"}><Link className="nav-wordmark" href="/products">Shop</Link><Link className="nav-spotlight" href="/spotlight"><span>Spot</span><span>light</span></Link><Link className="nav-wordmark" href="/about">Our Journey</Link></nav>
 <div className="header-actions"><Link href="/products" aria-label="Search"><Search/></Link><Link href="/auth/login" aria-label="Account"><UserRound/></Link><Link href="/cart" className="bag" aria-label={`Bag, ${count} items`}><ShoppingBag/><b>{count}</b></Link><button onClick={()=>setOpen(!open)} className="menu" aria-label="Menu">{open?<X/>:<Menu/>}</button></div>
 </header>
}
