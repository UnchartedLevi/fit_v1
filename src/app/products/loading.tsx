import { ShopHero } from "@/components/shop-hero";
import { ProductsLoadingSkeleton } from "@/components/products-loading-skeleton";

export default function ProductsLoading() {
  return (
    <>
      <ShopHero />
      <div className="page-shell" id="products">
        <ProductsLoadingSkeleton />
      </div>
    </>
  );
}
