import { Suspense } from "react";
import { ProductsBrowser } from "@/components/products-browser";
import { listCategories, listProducts } from "@/lib/catalogue";
import ProductsLoading from "./loading";

type SearchParamsProps = {
  category?: string;
  size?: string;
  sort?: string;
  q?: string;
};

async function ProductsContent({ params }: { params: SearchParamsProps }) {
  const [products, categories] = await Promise.all([
    listProducts({}),
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
    <Suspense key={JSON.stringify(params)} fallback={<ProductsLoading />}>
      <ProductsContent params={params} />
    </Suspense>
  );
}


