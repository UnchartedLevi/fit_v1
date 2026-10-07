"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { money } from "@/lib/products";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock_quantity <= 0;
  const variantPrices = (product.variants ?? []).map((variant) => variant.price_override ?? product.price);
  const minimumPrice = variantPrices.length ? Math.min(...variantPrices) : product.price;
  const maximumPrice = variantPrices.length ? Math.max(...variantPrices) : product.price;
  const discount = product.compareAtPrice && minimumPrice > 0 && product.compareAtPrice > minimumPrice
    ? Math.round(((product.compareAtPrice - minimumPrice) / product.compareAtPrice) * 100)
    : null;

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`}>
        <ProductVisual name={product.name} image={product.images[0]} />
        <div className="product-meta">
          <div>
            <h3>{product.name}</h3>
            <p>
              {product.category}
              {soldOut ? " · Out of stock" : ""}
            </p>
          </div>
          <div className="price-stack">
            <b>{minimumPrice === maximumPrice ? money(minimumPrice) : `${money(minimumPrice)} – ${money(maximumPrice)}`}</b>
            {product.compareAtPrice ? <s>{money(product.compareAtPrice)}</s> : null}
            {discount ? <span>{minimumPrice !== maximumPrice ? "Up to " : ""}{discount}% off</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
