import type { Metadata } from "next";
import "./globals.css";
import "./hero.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "sonner";

const siteUrl = "https://fits4l.xyz";
const description = "Premium sportswear and football-inspired streetwear from Covenant University, Ota, Nigeria.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "FITS — Made for the game", template: "%s | FITS" },
  description,
  applicationName: "FITS",
  keywords: ["FITS", "Fits for Life", "Covenant University", "Ota", "Nigeria", "sportswear", "football", "jerseys", "streetwear"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_NG", url: "/", siteName: "FITS", title: "FITS — Made for the game", description, images: [{ url: "/hero/fits-hero-1.jpg", width: 1200, height: 630, alt: "FITS sportswear" }] },
  twitter: { card: "summary_large_image", title: "FITS — Made for the game", description, images: ["/hero/fits-hero-1.jpg"] },
  icons: { icon: [{ url: "/icon.png", type: "image/png" }], shortcut: "/icon.png", apple: "/icon.png" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const organization = { "@context": "https://schema.org", "@type": "Organization", name: "FITS", url: siteUrl, logo: `${siteUrl}/brand/fits-logo-black.png`, sameAs: ["https://x.com/fits4l"], address: { "@type": "PostalAddress", addressLocality: "Ota", addressRegion: "Ogun", addressCountry: "NG" } };
  return <html lang="en-NG"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} /><CartProvider><SiteHeader /><main>{children}</main><SiteFooter /><Toaster position="top-center" /></CartProvider></body></html>;
}
