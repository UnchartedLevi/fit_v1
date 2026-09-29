"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { StoreProduct } from "@/lib/commerce-types";
import { ProductCard } from "./product-card";
import { SocialFollowModal } from "./social-follow-modal";
import { ShopHero } from "./shop-hero";
import { FilterDrawer } from "./filter-drawer";

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
  const [sort, setSort] = useState(initialSort || searchParams.get("sort") || "new");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Listen for real-time search events dispatched by the navbar search bar
  useEffect(() => {
    function handleSearchEvent(e: Event) {
      const customEvent = e as CustomEvent<string>;
      setSearch(customEvent.detail ?? "");
      setPage(1);
    }
    window.addEventListener("fits:search", handleSearchEvent);
    return () => window.removeEventListener("fits:search", handleSearchEvent);
  }, []);

  // Sync state changes with the URL for bookmarking and sharing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");

    if (size) url.searchParams.set("size", size);
    else url.searchParams.delete("size");

    if (sort && sort !== "new") url.searchParams.set("sort", sort);
    else url.searchParams.delete("sort");

    if (search) url.searchParams.set("q", search);
    else url.searchParams.delete("q");

    window.history.replaceState(null, "", url.toString());
  }, [category, size, sort, search]);

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
      .sort((a, b) => {
        // Featured products appear first
        const featA = a.featured ? 1 : 0;
        const featB = b.featured ? 1 : 0;

        if (sort === "new" || !sort) {
          if (featB !== featA) return featB - featA;
          return b.id.localeCompare(a.id);
        }
        if (sort === "low") return a.price - b.price;
        if (sort === "high") return b.price - a.price;
        return b.id.localeCompare(a.id);
      });
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

  // Count active non-default filters (size, sort, and category if selected via drawer/bar)
  const activeFilterCount = [
    Boolean(size),
    Boolean(sort && sort !== "new"),
    Boolean(category),
  ].filter(Boolean).length;

  // Active category display name
  const activeCategoryObj = categories.find(
    (c) =>
      c.slug.toLowerCase() === category.toLowerCase() ||
      c.name.toLowerCase() === category.toLowerCase()
  );
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : category;

  function handleClearSearch() {
    setSearch("");
    setPage(1);
    window.dispatchEvent(new CustomEvent("fits:search", { detail: "" }));
  }

  function handleClearAll() {
    setCategory("");
    setSize("");
    setSort("new");
    handleClearSearch();
  }

  return (
    <>
      <SocialFollowModal />

      {/* Hero Banner with Taller Height and Smooth Rotations */}
      <ShopHero />

      <div className="page-shell" id="products">
        {/* Single-Line Category & Filter Bar (Adidas Concept) */}
        <div className="shop-subbar">
          <div
            className="shop-categories-scroll"
            role="tablist"
            aria-label="Filter by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!category}
              className={`shop-category-link ${!category ? "active" : ""}`}
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
            >
              All
            </button>
            {categories.map((item) => {
              const isSelected =
                category.toLowerCase() === (item.slug || item.name).toLowerCase();
              return (
                <button
                  key={item.slug}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`shop-category-link ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setCategory(isSelected ? "" : item.slug || item.name);
                    setPage(1);
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="filter-sort-button"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open filter and sort drawer"
          >
            <span className="filter-sort-button__label">Filter &amp; Sort</span>
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 ? (
              <span className="filter-sort-button__badge">{activeFilterCount}</span>
            ) : null}
          </button>
        </div>

        {/* Applied Filters Quick Bar (if active) */}
        {(category || size || (sort && sort !== "new") || search) ? (
          <div className="shop-applied-bar">
            {category ? (
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setPage(1);
                }}
                className="shop-applied-tag"
              >
                <span>{activeCategoryName}</span>
                <X size={12} />
              </button>
            ) : null}

            {size ? (
              <button
                type="button"
                onClick={() => {
                  setSize("");
                  setPage(1);
                }}
                className="shop-applied-tag"
              >
                <span>Size: {size}</span>
                <X size={12} />
              </button>
            ) : null}

            {sort && sort !== "new" ? (
              <button
                type="button"
                onClick={() => {
                  setSort("new");
                  setPage(1);
                }}
                className="shop-applied-tag"
              >
                <span>Sort: {sort === "low" ? "Price: Low to High" : "Price: High to Low"}</span>
                <X size={12} />
              </button>
            ) : null}

            {search ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="shop-applied-tag"
              >
                <span>Search: &ldquo;{search}&rdquo;</span>
                <X size={12} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleClearAll}
              className="shop-applied-clear"
            >
              Clear all
            </button>
          </div>
        ) : null}

        {/* Products Grid */}
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
          <div className="empty">
            <h3>No products found</h3>
            <p style={{ color: "#777", marginTop: "8px", marginBottom: "20px" }}>
              Try adjusting your search or clearing applied filters to view more items.
            </p>
            <button
              type="button"
              className="button"
              onClick={handleClearAll}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter and Sort Sidebar Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        category={category}
        setCategory={(cat) => {
          setCategory(cat);
          setPage(1);
        }}
        size={size}
        setSize={(sz) => {
          setSize(sz);
          setPage(1);
        }}
        sort={sort}
        setSort={(st) => {
          setSort(st);
          setPage(1);
        }}
        categories={categories}
        resultCount={visibleProducts.length}
        onClearAll={handleClearAll}
      />
    </>
  );
}
