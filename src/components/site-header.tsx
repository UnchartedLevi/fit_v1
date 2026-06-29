"use client";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";
export function SiteHeader(){
 const [open,setOpen]=useState(false); const {count}=useCart();
 return <header className="site-header"><Link href="/" className="logo">FITS</Link>
 <nav className={open?"nav open":"nav"}><Link href="/products">Shop</Link><Link href="/products?category=Jerseys">Jerseys</Link><Link href="/products?category=Sets">Sets</Link><Link href="/#story">Our story</Link></nav>
 <div className="header-actions"><Link href="/products" aria-label="Search"><Search/></Link><Link href="/auth/login" aria-label="Account"><UserRound/></Link><Link href="/cart" className="bag" aria-label={`Bag, ${count} items`}><ShoppingBag/><b>{count}</b></Link><button onClick={()=>setOpen(!open)} className="menu" aria-label="Menu">{open?<X/>:<Menu/>}</button></div>
 </header>
}

