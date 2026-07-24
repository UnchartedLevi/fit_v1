import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
// import { demoProducts } from "@/lib/products";
// import { ProductCard } from "@/components/product-card";
import { HeroScene } from "@/components/hero-scene";
import { getInstagramSpotlights } from "@/lib/instagram";

export default async function Home() {
  const spotlights = await getInstagramSpotlights();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">FITS FOOTBALL PRESENTS</span>
          <h1>
            OWN
            <br />
            THE
            <br />
            WALK-IN.
          </h1>
          <p>Campus-ready football pieces made for the tunnel, the stands, and every move after class.</p>
          <div className="hero-actions">
            <Link className="button light-button" href="/products">
              Shop the collection <ArrowRight />
            </Link>
            <Link className="button ghost-button" href="/spotlight">
              Discover the drop <ArrowRight />
            </Link>
          </div>
          <div className="hero-quick-links" aria-label="Featured categories">
            <Link href="/products?category=Jerseys">Jerseys</Link>
            <Link href="/products?category=Sets">Sets</Link>
            <Link href="/products?category=Accessories">Accessories</Link>
          </div>
        </div>
        <HeroScene />
        <div className="hero-picture-stack" aria-hidden="true">
          <span className="hero-picture hero-picture-one" />
          <span className="hero-picture hero-picture-two" />
          <span className="hero-picture hero-picture-three" />
          <span className="hero-picture hero-picture-four" />
          <span className="hero-picture hero-picture-five" />
        </div>
      </section>

      <section className="ticker" aria-label="FITS announcements">
        <div className="ticker-track">
          <span>NEW SEASON &nbsp;—&nbsp; FITS FOR LIFE &nbsp;—&nbsp; COVENANT UNIVERSITY &nbsp;—&nbsp; BUILT FOR THE GAME &nbsp;—&nbsp;</span>
          <span aria-hidden="true">NEW SEASON &nbsp;—&nbsp; FITS FOR LIFE &nbsp;—&nbsp; COVENANT UNIVERSITY &nbsp;—&nbsp; BUILT FOR THE GAME &nbsp;—&nbsp;</span>
        </div>
      </section>

      <section className="spotlights" id="spotlights">
        <div className="spotlights-head">
          <div className="spotlight-wordmark" aria-label="Spotlight">
            <span>Sport</span>
            <span>light</span>
          </div>
          <h2>
            LATEST
            <br />
            NEWS.
          </h2>
          <p>Fresh FITS Instagram posts styled like campus news. Tap a card to open the original post.</p>
        </div>
        <div className="spotlight-grid">
          {spotlights.map((spotlight) => (
            <a
              className={spotlight.image ? "spotlight-card has-media" : "spotlight-card"}
              href={spotlight.href}
              target="_blank"
              rel="noreferrer"
              key={spotlight.number}
              style={spotlight.image ? { backgroundImage: `url(${spotlight.image})` } : undefined}
            >
              <span>{spotlight.number}</span>
              <div>
                <small>{spotlight.date ?? "Latest"} / Instagram</small>
                <h3>{spotlight.title}</h3>
                <p>{spotlight.text}</p>
              </div>
              <ArrowUpRight />
            </a>
          ))}
        </div>
      </section>

      {/*
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">SELECTED / 01</span>
            <h2>New arrivals</h2>
          </div>
          <Link href="/products">
            View all <ArrowRight />
          </Link>
        </div>
        <div className="product-grid">
          {demoProducts.filter((x) => x.featured).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      */}

      <section className="category-grid">
        <Link href="/products?category=Jerseys">
          <span>01</span>
          <h3>JERSEYS</h3>
          <p>On-pitch energy, off-pitch fit.</p>
        </Link>
        <Link href="/products?category=Sets">
          <span>02</span>
          <h3>SETS</h3>
          <p>Complete looks. Zero compromise.</p>
        </Link>
        <Link href="/products?category=Accessories">
          <span>03</span>
          <h3>ACCESSORIES</h3>
          <p>The finishing details.</p>
        </Link>
      </section>

      <section className="cta">
        <span>FITS FOR LIFE</span>
        <h2>
          YOUR NEXT
          <br />
          UNIFORM.
        </h2>
        <Link className="button light-button" href="/products">
          Shop now <ArrowRight />
        </Link>
      </section>
    </>
  );
}
