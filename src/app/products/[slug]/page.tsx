import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/lib/catalogue";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = product.shortDescription ?? product.description;
  const image = product.images[0];
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { type: "website", title: product.name, description, images: image ? [{ url: image, alt: product.name }] : [] },
    twitter: { card: "summary_large_image", title: product.name, description, images: image ? [image] : [] },
  };
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts({ category: product.categorySlug ?? product.category })).filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <div className="page-shell">
      <ProductDetail product={product} />
      <section className="section" style={{ paddingInline: 0 }}>
        <div className="section-head"><h2>You may also like</h2></div>
        <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>
    </div>
  );
}
