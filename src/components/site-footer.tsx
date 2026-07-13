import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div>
        <Link href="/" className="brand-logo footer-logo" aria-label="FITS home">
          <Image src="/brand/fits-logo-white.png" alt="FITS" width={557} height={296} />
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
          Instagram
        </a>
        <a href="https://x.com/fits4l" target="_blank" rel="noreferrer">
          X / Twitter
        </a>
        <a href="https://wa.me/2347045700851" target="_blank" rel="noreferrer">
          WhatsApp: +234 704 570 0851
        </a>
        <a href="https://t.me/+2347045700851" target="_blank" rel="noreferrer">
          Telegram: +234 704 570 0851
        </a>
        <p>Covenant University, Ota, Ogun, Nigeria</p>
      </div>
      <small>© {new Date().getFullYear()} FITS. All rights reserved.</small>
    </footer>
  );
}
