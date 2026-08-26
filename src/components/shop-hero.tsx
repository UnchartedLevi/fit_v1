"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  { label: "Football", title: "PLAY THE FULL 90.", copy: "Boots, balls, grip socks and match-day essentials.", href: "/products?category=football#products", image: "/hero/fits-hero-2.jpg" },
  { label: "Basketball", title: "OWN THE COURT.", copy: "Basketballs and training pieces for every run.", href: "/products?q=basketball#products", image: "/hero/fits-hero-4.jpg" },
  { label: "Jerseys", title: "WEAR YOUR COLOURS.", copy: "Performance jerseys made for the pitch and campus.", href: "/products?category=jerseys#products", image: "/stock/jersey-man.jpg" },
  { label: "Sport kits", title: "READY AS A TEAM.", copy: "Training sets, shorts, bibs and coordinated essentials.", href: "/products?q=training#products", image: "/category/sets.jpg" },
];

export function ShopHero() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000); return () => window.clearInterval(timer); }, []);
  const slide = slides[active];
  return <section className="shop-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.12)), url(${slide.image})` }}>
    <div className="shop-hero__copy"><span className="eyebrow">SHOP / {slide.label.toUpperCase()}</span><h1>{slide.title}</h1><p>{slide.copy}</p><Link className="button light-button" href={slide.href}>Shop now <ArrowRight /></Link></div>
    <div className="shop-hero__tabs" role="tablist" aria-label="Shop categories">{slides.map((item, index) => <button key={item.label} type="button" className={active === index ? "active" : ""} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}</div>
  </section>;
}
