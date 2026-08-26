"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { money } from "@/lib/products";
import { ProductVisual } from "./product-visual";

function discountPercent(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product);
  const soldOut = product.stock_quantity <= 0;
  const variantPrices = (product.variants ?? []).map((variant) => variant.price_override ?? product.price);
  const minimumPrice = variantPrices.length ? Math.min(...variantPrices) : product.price;
  const maximumPrice = variantPrices.length ? Math.max(...variantPrices) : product.price;

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
            {discount ? <span>{discount}% off</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
