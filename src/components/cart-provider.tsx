"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product, ProductVariant } from "@/lib/types";
import { toast } from "sonner";

const CART_STORAGE_KEY = "fits-cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product, variant: ProductVariant, q?: number) => void;
  update: (id: string, variantId: string, q: number) => void;
  remove: (id: string, variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return Boolean(item.product && typeof item.product.id === "string" && typeof item.variantId === "string" && typeof item.quantity === "number");
}

function clampQuantity(variant: ProductVariant, quantity: number) {
  return Math.max(1, Math.min(variant.stock_quantity, quantity));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]") as unknown;
        setItems(Array.isArray(stored) ? stored.filter(isCartItem).map((item) => {
          const variant = item.product.variants?.find((candidate) => candidate.id === item.variantId);
          return variant ? { ...item, quantity: clampQuantity(variant, item.quantity), unitPrice: variant.price_override ?? item.product.price } : item;
        }) : []);
      } catch {
        setItems([]);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
        subtotal: items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
      add: (product: Product, variant: ProductVariant, quantity = 1) => {
        setItems((current) => {
          const found = current.find((item) => item.product.id === product.id && item.variantId === variant.id);
          if (found) {
            return current.map((item) => (item === found ? { ...item, quantity: clampQuantity(variant, item.quantity + quantity) } : item));
          }
          const optionName = typeof variant.option_values?.option === "string" ? variant.option_values.option : null;
          const option = [optionName, variant.size && !optionName && !["premium", "standard"].includes(variant.size.toLowerCase()) ? `Size ${variant.size}` : null, variant.size && !optionName && ["premium", "standard"].includes(variant.size.toLowerCase()) ? variant.size : null, variant.colour && variant.colour !== "Default" ? variant.colour : null].filter(Boolean).join(" / ") || "One Size";
          return [...current, { product, variantId: variant.id, option, size: variant.size && !["premium", "standard"].includes(variant.size.toLowerCase()) ? variant.size : null, quantity: clampQuantity(variant, quantity), unitPrice: variant.price_override ?? product.price }];
        });
        toast.success("Added to bag");
      },
      update: (id: string, variantId: string, quantity: number) =>
        setItems((current) => current.map((item) => {
          if (item.product.id !== id || item.variantId !== variantId) return item;
          const variant = item.product.variants?.find((candidate) => candidate.id === variantId);
          return variant ? { ...item, quantity: clampQuantity(variant, quantity) } : item;
        })),
      remove: (id: string, variantId: string) => setItems((current) => current.filter((item) => !(item.product.id === id && item.variantId === variantId))),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider missing");
  return context;
};
