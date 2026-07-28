import type { MetadataRoute } from "next";

const siteUrl = "https://fits4l.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ["", "/products", "/spotlight", "/about"].map((path) => ({ url: `${siteUrl}${path}`, lastModified, changeFrequency: path === "/products" || path === "/spotlight" ? "daily" : "weekly", priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.7 }));
}
