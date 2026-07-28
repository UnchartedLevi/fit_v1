"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "@/lib/types";
import { toast } from "sonner";

const CART_STORAGE_KEY = "fits-cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product, size: string, q?: number) => void;
  update: (id: string, size: string, q: number) => void;
  remove: (id: string, size: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return Boolean(item.product && typeof item.product.id === "string" && typeof item.size === "string" && typeof item.quantity === "number");
}

function clampQuantity(product: Product, quantity: number) {
  return Math.max(1, Math.min(product.stock_quantity, quantity));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]") as unknown;
        setItems(Array.isArray(stored) ? stored.filter(isCartItem).map((item) => ({ ...item, quantity: clampQuantity(item.product, item.quantity) })) : []);
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
      subtotal: items.reduce((total, item) => total + item.quantity * item.product.price, 0),
      add: (product: Product, size: string, quantity = 1) => {
        setItems((current) => {
          const found = current.find((item) => item.product.id === product.id && item.size === size);
          if (found) {
            return current.map((item) => (item === found ? { ...item, quantity: clampQuantity(product, item.quantity + quantity) } : item));
          }
          return [...current, { product, size, quantity: clampQuantity(product, quantity) }];
        });
        toast.success("Added to bag");
      },
      update: (id: string, size: string, quantity: number) =>
        setItems((current) => current.map((item) => (item.product.id === id && item.size === size ? { ...item, quantity: clampQuantity(item.product, quantity) } : item))),
      remove: (id: string, size: string) => setItems((current) => current.filter((item) => !(item.product.id === id && item.size === size))),
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
