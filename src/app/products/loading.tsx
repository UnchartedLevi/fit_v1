import { ShopHero } from "@/components/shop-hero";
import { ProductsLoadingSkeleton } from "@/components/products-loading-skeleton";

export default function ProductsLoading() {
  return (
    <>
      <ShopHero />
      <div className="page-shell" id="products">
        <span className="eyebrow">COLLECTION / ALL</span>
        <h1 className="page-title">SHOP ALL.</h1>
        <ProductsLoadingSkeleton />
      </div>
    </>
  );
}
