"use client";
import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { Product } from "@/lib/types";

export function ProductsBrowser({
  products,
  categories,
  initialCategory = "",
  initialSize = "",
  initialSort = "new",
}: {
  products: Product[];
  categories: { name: string; slug: string }[];
  initialCategory?: string;
  initialSize?: string;
  initialSort?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState(initialSort);

  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => !category || product.category === category || product.categorySlug === category)
        .filter((product) => !size || product.sizes.includes(size))
        .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.id.localeCompare(a.id))),
    [category, products, size, sort],
  );

  return (
    <>
      <div className="filters">
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug || item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={size} onChange={(event) => setSize(event.target.value)} aria-label="Size">
          <option value="">All sizes</option>
          {["S", "M", "L", "XL", "XXL", "One Size"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort">
          <option value="new">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty">No pieces match these filters.</div>
      )}
    </>
  );
}
