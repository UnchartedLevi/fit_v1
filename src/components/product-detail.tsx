"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { money } from "@/lib/products";
import { ProductVisual } from "./product-visual";
import { useCart } from "./cart-provider";
import { getProductPurchaseMode, getVariantChoiceLabel } from "@/lib/product-options";

export function ProductDetail({ product }: { product: Product }) {
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants.find((variant) => variant.stock_quantity > 0)?.id ?? variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [addedSelection, setAddedSelection] = useState<string | null>(null);
  const router = useRouter();
  const { add } = useCart();
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const purchaseMode = getProductPurchaseMode(variants);
  const soldOut = !selectedVariant || selectedVariant.stock_quantity <= 0;
  const maxQuantity = Math.max(0, selectedVariant?.stock_quantity ?? 0);
  const selectedQuantity = soldOut ? 0 : Math.min(qty, maxQuantity);
  const lowStock = !soldOut && maxQuantity <= 10;
  const currentSelection = `${product.id}:${selectedVariant?.id ?? ""}:${selectedQuantity}`;
  const added = addedSelection === currentSelection;

  function handleMainAction() {
    if (soldOut) return;
    if (added) {
      router.push("/cart");
      return;
    }

    if (!selectedVariant) return;
    add(product, selectedVariant, selectedQuantity);
    setAddedSelection(currentSelection);
  }

  return (
    <div className="detail">
      <ProductVisual name={product.name} image={product.images[0]} />
      <div className="detail-info">
        <span className="eyebrow">{product.category} / FITS</span>
        <h1>{product.name}</h1>
        <p className="price">
          {selectedVariant ? money(selectedVariant.price_override ?? product.price) : money(product.price)} {product.compareAtPrice ? <s>{money(product.compareAtPrice)}</s> : null}
        </p>
        <p className="description">{product.description}</p>
        {purchaseMode !== "single" ? <><b>SELECT {purchaseMode.toUpperCase()}</b><div className="sizes">
          {variants.map((item) => (
            <button disabled={item.stock_quantity <= 0} className={`size ${variantId === item.id ? "active" : ""}`} onClick={() => { setVariantId(item.id); setQty(1); setAddedSelection(null); }} key={item.id}>
              {getVariantChoiceLabel(item, purchaseMode)}{purchaseMode === "option" ? ` · ${money(item.price_override ?? product.price)}` : ""}{item.stock_quantity <= 0 ? " · Sold out" : ""}
            </button>
          ))}
        </div></> : null}
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
          {soldOut ? "Out of stock" : added ? "Checkout" : `Add to bag - ${money((selectedVariant?.price_override ?? product.price) * selectedQuantity)}`}
        </button>
        <p className="stock">
          {soldOut ? "Out of stock" : "Secure checkout"} · Covenant University delivery
        </p>
      </div>
    </div>
  );
}
