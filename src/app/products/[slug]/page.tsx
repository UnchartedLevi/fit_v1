import { notFound } from "next/navigation";
import { getProductBySlug, listProducts } from "@/lib/catalogue";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts({ category: product.categorySlug ?? product.category })).filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <div className="page-shell">
      <ProductDetail product={product} />
      <section className="section" style={{ paddingInline: 0 }}>
        <div className="section-head">
          <h2>You may also like</h2>
        </div>
        <div className="product-grid">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
