import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function About() {
  return (
    <main className="page-shell">
      <span className="eyebrow">FITS / OUR JOURNEY</span>
      <h1 className="page-title">OUR JOURNEY.</h1>
      <section className="story" style={{ padding: 0 }}>
        <p>
          FITS started from football culture and the everyday rhythm around it: matchday energy, Covenant University movement, and
          clothes that stay useful after the final whistle.
        </p>
        <div>
          <h2>
            MADE FOR
            <br />
            THE GAME.
          </h2>
          <p>
            Every drop is built around the people who carry the game into the street. We focus on clean silhouettes,
            strong graphics, and pieces that feel at home in the stands, on the walk-in, and through the rest of the
            week.
          </p>
        </div>
      </section>
      <Link className="button" href="/products" style={{ marginTop: 60 }}>
        Shop the collection <ArrowRight />
      </Link>
    </main>
  );
}
