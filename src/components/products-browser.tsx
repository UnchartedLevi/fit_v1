"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

const PRODUCTS_PER_PAGE = 12;

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
  const [page, setPage] = useState(1);

  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => !category || product.category === category || product.categorySlug === category)
        .filter((product) => !size || product.sizes.includes(size))
        .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.id.localeCompare(a.id))),
    [category, products, size, sort],
  );
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = visibleProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  return (
    <>
      <div className="filters">
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug || item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={size} onChange={(event) => { setSize(event.target.value); setPage(1); }} aria-label="Size">
          <option value="">All sizes</option>
          {["S", "M", "L", "XL", "XXL", "One Size"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort">
          <option value="new">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      {visibleProducts.length ? (
        <>
          <div className="product-count">{visibleProducts.length} products · Page {currentPage} of {totalPages}</div>
          <div className="product-grid">
            {pagedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="pagination" aria-label="Product pagination">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                <button key={item} type="button" className={item === currentPage ? "active" : ""} onClick={() => setPage(item)} aria-current={item === currentPage ? "page" : undefined}>{item}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty">No pieces match these filters.</div>
      )}
    </>
  );
}
