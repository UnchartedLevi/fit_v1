import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getInstagramSpotlights } from "@/lib/instagram";

export default async function SpotlightPage() {
  const posts = await getInstagramSpotlights(8);
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <main className="spotlight-page">
      <section className="spotlight-newsletter-hero">
        <div>
          <span className="eyebrow">FITS NEWSLETTER / SPOTLIGHT</span>
          <div className="spotlight-wordmark spotlight-wordmark-large" aria-label="Spotlight">
            <span>Spot</span>
            <span>light</span>
          </div>
          <h1>
            CAMPUS
            <br />
            CULTURE,
            <br />
            WEEKLY.
          </h1>
        </div>
        <div className="spotlight-newsletter-copy">
          <p>
            The latest FITS posts pulled from Instagram and restyled as a campus newspaper feed for drops, campaign notes,
            matchday fits, and Covenant University culture.
          </p>
          <Link className="button light-button" href="https://www.instagram.com/fits4l/" target="_blank">
            Follow FITS <ArrowUpRight />
          </Link>
        </div>
      </section>

      {featured ? (
        <a
          className={featured.image ? "spotlight-feature has-media" : "spotlight-feature"}
          href={featured.href}
          target="_blank"
          rel="noreferrer"
          style={featured.image ? { backgroundImage: `url(${featured.image})` } : undefined}
        >
          <span>{featured.number}</span>
          <div>
            <small>Featured Instagram dispatch / {featured.date ?? "Latest"}</small>
            <h2>{featured.title}</h2>
            <p>{featured.text}</p>
          </div>
          <ArrowUpRight />
        </a>
      ) : null}

      <section className="spotlight-news-grid" aria-label="Instagram-linked spotlight posts">
        {rest.map((post) => (
          <a
            className={post.image ? "spotlight-news-card has-media" : "spotlight-news-card"}
            href={post.href}
            target="_blank"
            rel="noreferrer"
            key={post.id}
            style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
          >
            <span>{post.number}</span>
            <div>
              <small>{post.date ?? "Latest"} / Instagram</small>
              <h2>{post.title}</h2>
              <p>{post.text}</p>
            </div>
            <ArrowRight />
          </a>
        ))}
      </section>
    </main>
  );
}
