import { Suspense } from "react";
import { ProductsBrowser } from "@/components/products-browser";
import { ShopHero } from "@/components/shop-hero";
import { listCategories, listProducts } from "@/lib/catalogue";
import { ProductsLoadingSkeleton } from "@/components/products-loading-skeleton";

type SearchParamsProps = {
  category?: string;
  size?: string;
  sort?: string;
  q?: string;
};

async function ProductsContent({ params }: { params: SearchParamsProps }) {
  const [products, categories] = await Promise.all([
    listProducts(params),
    listCategories(),
  ]);

  return (
    <ProductsBrowser
      products={products}
      categories={categories}
      initialCategory={params.category ?? ""}
      initialSize={params.size ?? ""}
      initialSort={params.sort ?? "new"}
    />
  );
}

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const params = await searchParams;

  return (
    <>
      <ShopHero />
      <div className="page-shell" id="products">
        <span className="eyebrow">COLLECTION / ALL</span>
        <h1 className="page-title">SHOP ALL.</h1>
        <Suspense key={JSON.stringify(params)} fallback={<ProductsLoadingSkeleton />}>
          <ProductsContent params={params} />
        </Suspense>
      </div>
    </>
  );
}

