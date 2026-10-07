import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div>
        <Link href="/" className="brand-logo footer-logo" aria-label="FITS home">
          <Image src="/brand/fits-wordmark-racing-white.svg" alt="FITS" width={210} height={76} />
        </Link>
        <p>Made for the game. Worn for life.</p>
      </div>
      <div>
        <b>Explore</b>
        <Link href="/products">Shop all</Link>
        <Link href="/products?category=Jerseys">Jerseys</Link>
        <Link href="/auth/login">Account</Link>
      </div>
      <div>
        <b>Follow</b>
        <a href="https://www.instagram.com/fits4l/" target="_blank" rel="noreferrer">
          Instagram (@fits4l)
        </a>
        <a href="https://x.com/fits4l" target="_blank" rel="noreferrer">
          X/Twitter (@fits4l)
        </a>
        <a href="https://t.me/fits4l" target="_blank" rel="noreferrer">
          Telegram (@fits4l)
        </a>
      </div>
      <small>© {new Date().getFullYear()} FITS. All rights reserved.</small>
    </footer>
  );
}
