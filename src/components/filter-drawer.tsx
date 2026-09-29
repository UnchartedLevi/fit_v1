"use client";

import { useEffect } from "react";
import { X, ArrowRight, Check } from "lucide-react";

interface CategoryItem {
  name: string;
  slug: string;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  setCategory: (cat: string) => void;
  size: string;
  setSize: (size: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  categories: CategoryItem[];
  resultCount: number;
  onClearAll: () => void;
}

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "One Size"];

const SORT_OPTIONS = [
  { id: "new", label: "Newest" },
  { id: "low", label: "Price (low - high)" },
  { id: "high", label: "Price (high - low)" },
];

export function FilterDrawer({
  isOpen,
  onClose,
  category,
  setCategory,
  size,
  setSize,
  sort,
  setSort,
  categories,
  resultCount,
  onClearAll,
}: FilterDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasActiveFilters = Boolean(category || size || (sort && sort !== "new"));

  // Find human-readable category name
  const activeCategoryObj = categories.find(
    (c) => c.slug.toLowerCase() === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
  );
  const activeCategoryName = activeCategoryObj ? activeCategoryObj.name : category;

  const activeSortObj = SORT_OPTIONS.find((s) => s.id === sort);

  function handleShowItems() {
    onClose();
    const target = document.getElementById("products") || document.querySelector(".product-grid");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="filter-drawer-overlay" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="filter-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="filter-drawer-panel">
        {/* Header */}
        <div className="filter-drawer-header">
          <div className="filter-drawer-title-group">
            <h2 className="filter-drawer-title">FILTER &amp; SORT</h2>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearAll}
                className="filter-drawer-clear-all"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="filter-drawer-close"
            aria-label="Close filters"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="filter-drawer-body">
          {/* Applied Filters Chips (Adidas style) */}
          {hasActiveFilters ? (
            <div className="filter-drawer-section">
              <span className="filter-section-label">Applied filters</span>
              <div className="filter-applied-chips">
                {category ? (
                  <button
                    type="button"
                    onClick={() => setCategory("")}
                    className="filter-chip"
                    aria-label={`Remove category filter: ${activeCategoryName}`}
                  >
                    <X size={13} />
                    <span>{activeCategoryName}</span>
                  </button>
                ) : null}

                {size ? (
                  <button
                    type="button"
                    onClick={() => setSize("")}
                    className="filter-chip"
                    aria-label={`Remove size filter: ${size}`}
                  >
                    <X size={13} />
                    <span>Size: {size}</span>
                  </button>
                ) : null}

                {sort && sort !== "new" ? (
                  <button
                    type="button"
                    onClick={() => setSort("new")}
                    className="filter-chip"
                    aria-label={`Reset sort to newest`}
                  >
                    <X size={13} />
                    <span>Sort: {activeSortObj?.label}</span>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Sort By Section */}
          <div className="filter-drawer-section">
            <span className="filter-section-label">Sort by</span>
            <div className="filter-radio-group">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = (sort || "new") === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`filter-radio-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSort(opt.id)}
                  >
                    <div className="filter-radio-circle">
                      {isSelected ? <div className="filter-radio-inner" /> : null}
                    </div>
                    <span className="filter-radio-text">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Categories Section */}
          <div className="filter-drawer-section">
            <span className="filter-section-label">Category</span>
            <div className="filter-category-list">
              <button
                type="button"
                className={`filter-category-pill ${!category ? "active" : ""}`}
                onClick={() => setCategory("")}
              >
                {!category ? <Check size={14} /> : null}
                <span>All Categories</span>
              </button>
              {categories.map((c) => {
                const isSelected =
                  category.toLowerCase() === (c.slug || c.name).toLowerCase();
                return (
                  <button
                    key={c.slug}
                    type="button"
                    className={`filter-category-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setCategory(isSelected ? "" : c.slug || c.name)}
                  >
                    {isSelected ? <Check size={14} /> : null}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Section */}
          <div className="filter-drawer-section">
            <span className="filter-section-label">Size</span>
            <div className="filter-size-grid">
              {AVAILABLE_SIZES.map((sz) => {
                const isSelected = size === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    className={`filter-size-box ${isSelected ? "active" : ""}`}
                    onClick={() => setSize(isSelected ? "" : sz)}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="filter-drawer-footer">
          <div className="filter-drawer-footer-count">
            {resultCount} {resultCount === 1 ? "item found" : "items found"}
          </div>
          <button
            type="button"
            onClick={handleShowItems}
            className="filter-drawer-submit-btn"
          >
            <span>Show items</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
