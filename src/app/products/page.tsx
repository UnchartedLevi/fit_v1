import { ProductsBrowser } from "@/components/products-browser";
import { listCategories, listProducts } from "@/lib/catalogue";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([listProducts(params), listCategories()]);

  return (
    <div className="page-shell">
      <span className="eyebrow">COLLECTION / ALL</span>
      <h1 className="page-title">SHOP ALL.</h1>
      <ProductsBrowser
        products={products}
        categories={categories}
        initialCategory={params.category ?? ""}
        initialSize={params.size ?? ""}
        initialSort={params.sort ?? "new"}
      />
    </div>
  );
}
