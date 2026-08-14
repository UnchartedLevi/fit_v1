"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { money } from "@/lib/products";
import { ProductVisual } from "./product-visual";
import { useCart } from "./cart-provider";

export function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [addedSelection, setAddedSelection] = useState<string | null>(null);
  const router = useRouter();
  const { add } = useCart();
  const soldOut = product.stock_quantity <= 0;
  const maxQuantity = Math.max(0, product.stock_quantity);
  const selectedQuantity = soldOut ? 0 : Math.min(qty, maxQuantity);
  const lowStock = !soldOut && maxQuantity <= 10;
  const currentSelection = `${product.id}:${size}:${selectedQuantity}`;
  const added = addedSelection === currentSelection;

  function handleMainAction() {
    if (soldOut) return;
    if (added) {
      router.push("/cart");
      return;
    }

    add(product, size, selectedQuantity);
    setAddedSelection(currentSelection);
  }

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
          <button aria-label="Decrease quantity" disabled={soldOut || selectedQuantity <= 1} onClick={() => setQty(Math.max(1, selectedQuantity - 1))}>
            -
          </button>
          <span>{selectedQuantity}</span>
          <button aria-label="Increase quantity" disabled={soldOut || selectedQuantity >= maxQuantity} onClick={() => setQty(Math.min(maxQuantity, selectedQuantity + 1))}>
            +
          </button>
        </div>
        {lowStock ? <p className="low-stock">Only {maxQuantity} left</p> : null}
        <button className={`add-button ${added ? "checkout-state" : ""}`} disabled={soldOut} onClick={handleMainAction}>
          {soldOut ? "Out of stock" : added ? "Checkout" : `Add to bag - ${money(product.price * selectedQuantity)}`}
        </button>
        <p className="stock">
          {soldOut ? "Out of stock" : "Secure checkout"} · Covenant University delivery
        </p>
      </div>
    </div>
  );
}
