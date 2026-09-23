"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { StoreProduct } from "@/lib/commerce-types";
import { ProductCard } from "./product-card";
import { SocialFollowModal } from "./social-follow-modal";

const PRODUCTS_PER_PAGE = 12;

export function ProductsBrowser({
  products,
  categories,
  initialCategory = "",
  initialSize = "",
  initialSort = "new",
}: {
  products: StoreProduct[];
  categories: { name: string; slug: string }[];
  initialCategory?: string;
  initialSize?: string;
  initialSort?: string;
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(initialCategory || searchParams.get("category") || "");
  const [size, setSize] = useState(initialSize || searchParams.get("size") || "");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const targetCat = category.trim().toLowerCase();

    return products
      .filter((product) => {
        if (!q) return true;
        return (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q) ||
          (product.categories && product.categories.some((c) => c.toLowerCase().includes(q)))
        );
      })
      .filter((product) => {
        if (!targetCat) return true;
        const matchSlug = product.categorySlug?.toLowerCase() === targetCat;
        const matchCat = product.category?.toLowerCase() === targetCat;
        const matchMulti = product.categories?.some((c) => c.toLowerCase() === targetCat);
        return matchSlug || matchCat || matchMulti;
      })
      .filter((product) => !size || product.sizes.includes(size))
      .sort((a, b) =>
        sort === "low"
          ? a.price - b.price
          : sort === "high"
          ? b.price - a.price
          : b.id.localeCompare(a.id)
      );
  }, [category, products, search, size, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  function scrollToTop() {
    const target = document.getElementById("products") || document.querySelector(".page-shell");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    scrollToTop();
  }

  return (
    <>
      <SocialFollowModal />

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            maxWidth: "600px",
            marginBottom: "16px",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              color: "#888",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search jerseys, kits, basketballs, accessories..."
            aria-label="Search products"
            style={{
              width: "100%",
              padding: "12px 36px 12px 42px",
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              style={{
                position: "absolute",
                right: "12px",
                background: "transparent",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="filters">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug || item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={size}
            onChange={(event) => {
              setSize(event.target.value);
              setPage(1);
            }}
            aria-label="Size"
          >
            <option value="">All sizes</option>
            {["S", "M", "L", "XL", "XXL", "One Size"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            aria-label="Sort"
          >
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      {visibleProducts.length ? (
        <>
          <div className="product-count">
            {visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"} · Page {currentPage} of {totalPages}
          </div>
          <div className="product-grid">
            {pagedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="pagination" aria-label="Product pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === currentPage ? "active" : ""}
                  onClick={() => handlePageChange(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="empty">No pieces match these search criteria.</div>
      )}
    </>
  );
}
