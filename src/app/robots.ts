import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/auth/", "/checkout/", "/cart/"] }, sitemap: "https://fits4l.xyz/sitemap.xml" };
}
