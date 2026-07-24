"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { money } from "@/lib/products";
import { ProductVisual } from "./product-visual";
import { useCart } from "./cart-provider";

export function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const soldOut = product.stock_quantity <= 0;

  return (
    <div className="detail">
      <ProductVisual name={product.name} image={product.images[0]} />
      <div className="detail-info">
        <span className="eyebrow">{product.category} / FITS</span>
        <h1>{product.name}</h1>
        <p className="price">
          {money(product.price)} {product.compareAtPrice ? <s>{money(product.compareAtPrice)}</s> : null}
        </p>
        <p className="description">{product.description}</p>
        <b>SELECT SIZE</b>
        <div className="sizes">
          {product.sizes.map((item) => (
            <button className={`size ${size === item ? "active" : ""}`} onClick={() => setSize(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
        <div className="qty">
          <button disabled={soldOut} onClick={() => setQty(Math.max(1, qty - 1))}>
            −
          </button>
          <span>{soldOut ? 0 : qty}</span>
          <button disabled={soldOut} onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}>
            +
          </button>
        </div>
        <button className="add-button" disabled={soldOut} onClick={() => add(product, size, qty)}>
          {soldOut ? "Out of stock" : `Add to bag — ${money(product.price * qty)}`}
        </button>
        <p className="stock">
          {soldOut ? "Out of stock" : `${product.stock_quantity} available`} · Secure checkout · Covenant University delivery
        </p>
      </div>
    </div>
  );
}
