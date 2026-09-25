"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    label: "Football",
    title: "PLAY THE FULL 90.",
    copy: "Boots, balls, grip socks and match-day essentials.",
    href: "/products?category=football#products",
    image: "/hero/football.png",
  },
  {
    label: "Basketball",
    title: "OWN THE COURT.",
    copy: "Basketballs and training pieces for every run.",
    href: "/products?q=basketball#products",
    image: "/hero/basketball.png",
  },
  {
    label: "Jerseys",
    title: "WEAR YOUR COLOURS.",
    copy: "Performance jerseys made for the pitch and campus.",
    href: "/products?category=jerseys#products",
    image: "/hero/jerseys.png",
  },
  {
    label: "Gym & Fitness",
    title: "BUILT FOR THE WORK.",
    copy: "Training sets, gym gear and athletic essentials.",
    href: "/products?q=training#products",
    image: "/hero/gym-fitness.png",
  },
  {
    label: "Accessories",
    title: "FINISHING DETAILS.",
    copy: "Grip socks, headbands, bags and performance gear.",
    href: "/products?category=accessories#products",
    image: "/hero/accessories.jpg",
  },
];

export function ShopHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      6000
    );
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section
      className="shop-hero"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.28)), url(${slide.image})`,
      }}
    >
      <div className="shop-hero__copy">
        <span className="eyebrow">SHOP / {slide.label.toUpperCase()}</span>
        <h1>{slide.title}</h1>
        <p>{slide.copy}</p>
      </div>
      <div className="shop-hero__dots" role="tablist" aria-label="Shop slides">
        {slides.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-label={`Slide ${index + 1}: ${item.label}`}
            className={`shop-hero__dot ${active === index ? "active" : ""}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}

