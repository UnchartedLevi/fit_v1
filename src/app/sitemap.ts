import { MetadataRoute } from "next";
import { listProducts } from "@/lib/catalogue";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://fits4l.xyz";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/spotlight`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Generate product pages dynamically for the public catalogue.
  // Omit private/admin/auth/checkout/cart routes as requested.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await listProducts();
    productRoutes = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));
  } catch (err) {
    // If product listing fails at build time, fall back to static routes only.
    // No-op: sitemap will still be valid and bots can crawl main pages.
  }

  return [...staticRoutes, ...productRoutes];
}
import type { MetadataRoute } from "next";

const siteUrl = "https://fits4l.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ["", "/products", "/spotlight", "/about"].map((path) => ({ url: `${siteUrl}${path}`, lastModified, changeFrequency: path === "/products" || path === "/spotlight" ? "daily" : "weekly", priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.7 }));
}
