"use client";

import Image from "next/image";
import { Check, ChevronDown, Plus, Search, Tag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { money } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";
import type { ProductImageRecord, ProductVariantRecord } from "@/lib/commerce-types";

type CategoryOption = { id: string; name: string; slug: string };
type EditableVariant = Omit<Pick<ProductVariantRecord, "id" | "sku" | "size" | "colour" | "option_values" | "price_override" | "stock_quantity" | "is_active">, "id"> & { id?: string };
type AdminProduct = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  categoryName: string;
  category_ids: string[];
  categories: string[];
  is_sbu: boolean;
  base_price: number;
  compare_at_price: number | null;
  status: "active" | "draft" | "archived";
  featured: boolean;
  imageUrl: string;
  imageId?: string;
  variants: EditableVariant[];
  file?: File | null;
};
type RawProduct = Omit<AdminProduct, "categoryName" | "imageUrl" | "variants" | "category_ids" | "categories" | "is_sbu"> & {
  id: string;
  is_sbu?: boolean;
  category_ids?: string[];
  categories?: CategoryOption | CategoryOption[] | null;
  product_images?: ProductImageRecord[];
  product_variants?: ProductVariantRecord[];
};

const blankProduct = (): AdminProduct => ({
  name: "",
  slug: "",
  description: "",
  category_id: null,
  categoryName: "Football",
  category_ids: [],
  categories: [],
  is_sbu: true,
  base_price: 0,
  compare_at_price: null,
  status: "active",
  featured: false,
  imageUrl: "",
  variants: [{ sku: "", size: null, colour: "Default", option_values: {}, price_override: null, stock_quantity: 0, is_active: true }],
  file: null,
});

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const totalStock = (product: AdminProduct) => product.variants.filter((variant) => variant.is_active).reduce((total, variant) => total + Number(variant.stock_quantity || 0), 0);
const variantLabel = (variant: EditableVariant) => String(variant.option_values?.option ?? variant.size ?? (variant.colour && variant.colour !== "Default" ? variant.colour : "One Size"));

function normalizeProduct(
  product: RawProduct,
  metadataMap?: Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>
): AdminProduct {
  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoriesList = Array.isArray(product.categories) ? product.categories.map((c) => c.name) : category ? [category.name] : [];
  const images = product.product_images ?? [];
  const primaryImage = images.find((image) => image.is_primary) ?? images[0];

  const meta = metadataMap?.[product.id];
  const is_sbu = meta?.is_sbu !== undefined ? meta.is_sbu : product.is_sbu !== undefined ? product.is_sbu : true;
  const category_ids = meta?.category_ids || product.category_ids || (product.category_id ? [product.category_id] : []);
  const extraCategories = meta?.categories || [];
  const mergedCategories = [...new Set([...categoriesList, ...extraCategories])];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category_id: product.category_id,
    categoryName: mergedCategories.join(", ") || category?.name || "Uncategorized",
    category_ids,
    categories: mergedCategories,
    is_sbu,
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    status: product.status,
    featured: product.featured,
    imageUrl: primaryImage?.image_url ?? "",
    imageId: primaryImage?.id,
    variants: (product.product_variants ?? [])
      .filter((variant) => variant.is_active)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        colour: variant.colour,
        price_override: variant.price_override,
        stock_quantity: variant.stock_quantity,
        option_values: variant.option_values,
        is_active: variant.is_active,
      })),
    file: null,
  };
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary uploads are not configured.");
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", "fits/products");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const payload = await response.json();
  if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message || "Cloudinary upload failed.");
  return payload.secure_url as string;
}

export function AdminProductsEditor() {
  const client = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const load = useCallback(async () => {
    if (!client) return;
    const [
      { data: categoryData, error: categoryError },
      { data: productData, error: productError },
      { data: metaData },
    ] = await Promise.all([
      client.from("categories").select("id,name,slug").order("sort_order"),
      client
        .from("products")
        .select(
          "id,name,slug,description,category_id,base_price,compare_at_price,status,featured,categories(id,name,slug),product_images(id,product_id,image_url,alt_text,sort_order,is_primary),product_variants(id,product_id,sku,size,colour,option_values,price_override,stock_quantity,low_stock_threshold,is_active)"
        )
        .order("created_at", { ascending: false }),
      client.from("site_content").select("value").eq("key", "product_metadata").maybeSingle(),
    ]);

    if (categoryError || productError) {
      return toast.error(categoryError?.message || productError?.message || "Could not load products.");
    }

    const metadataMap = (metaData?.value as Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>) || {};
    setCategories((categoryData ?? []) as CategoryOption[]);
    setProducts(((productData ?? []) as unknown as RawProduct[]).map((p) => normalizeProduct(p, metadataMap)));
  }, [client]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) =>
      !normalized || [product.name, product.slug, product.categoryName].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [products, query]);

  function toggleCategory(catId: string) {
    if (!editing) return;
    const current = editing.category_ids || [];
    const next = current.includes(catId) ? current.filter((id) => id !== catId) : [...current, catId];
    const catNames = categories.filter((c) => next.includes(c.id)).map((c) => c.name);
    setEditing({
      ...editing,
      category_ids: next,
      categories: catNames,
      category_id: next[0] || null,
      categoryName: catNames.join(", "),
    });
  }

  function updateVariant(index: number, changes: Partial<EditableVariant>) {
    if (!editing) return;
    setEditing({
      ...editing,
      variants: editing.variants.map((variant, itemIndex) => (itemIndex === index ? { ...variant, ...changes } : variant)),
    });
  }

  function addVariant() {
    if (!editing) return;
    setEditing({
      ...editing,
      variants: [...editing.variants, { sku: "", size: null, colour: "Default", option_values: {}, price_override: null, stock_quantity: 0, is_active: true }],
    });
  }

  function removeVariant(index: number) {
    if (!editing || editing.variants.length === 1) return;
    setEditing({
      ...editing,
      variants: editing.variants.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !editing) return;
    setSaving(true);

    try {
      const slug = slugify(editing.slug || editing.name);
      if (!slug || !editing.name.trim()) throw new Error("Add a product name and slug.");

      const primaryCategory = categories.find((item) => editing.category_ids?.includes(item.id)) ?? categories.find((item) => item.id === editing.category_id);
      const selectedCategoryNames = categories.filter((c) => editing.category_ids?.includes(c.id)).map((c) => c.name);

      const payload: Record<string, unknown> = {
        name: editing.name.trim(),
        slug,
        description: editing.description.trim(),
        category_id: primaryCategory?.id ?? null,
        base_price: Number(editing.base_price),
        compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
        status: editing.status,
        featured: editing.featured,
      };

      const productResult = editing.id
        ? await client.from("products").update(payload).eq("id", editing.id).select("id").single()
        : await client.from("products").insert(payload).select("id").single();

      if (productResult.error || !productResult.data) throw productResult.error ?? new Error("Could not save product.");
      const productId = productResult.data.id as string;

      // Sync SBU and Multi-categories to site_content product_metadata
      try {
        const { data: metaData } = await client.from("site_content").select("value").eq("key", "product_metadata").maybeSingle();
        const metadataMap = (metaData?.value as Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>) || {};
        metadataMap[productId] = {
          is_sbu: editing.is_sbu,
          category_ids: editing.category_ids || [],
          categories: selectedCategoryNames,
        };
        await client.from("site_content").upsert({ key: "product_metadata", value: metadataMap });
      } catch (err) {
        console.warn("Could not sync metadata to site_content", err);
      }

      const activeIds = editing.variants.flatMap((variant) => (variant.id ? [variant.id] : []));
      if (editing.id) {
        let deactivate = client.from("product_variants").update({ is_active: false }).eq("product_id", productId);
        if (activeIds.length) deactivate = deactivate.not("id", "in", `(${activeIds.join(",")})`);
        await deactivate;
      }

      for (const [index, variant] of editing.variants.entries()) {
        const variantPayload = {
          product_id: productId,
          sku: variant.sku.trim() || `FITS-${slug}-${index + 1}`.toUpperCase(),
          size: typeof variant.option_values?.option === "string" ? null : variant.size?.trim() || null,
          colour: variant.colour?.trim() || "Default",
          option_values: typeof variant.option_values?.option === "string" ? { option: variant.option_values.option } : variant.size ? { size: variant.size } : {},
          price_override: variant.price_override === null || variant.price_override === undefined ? null : Number(variant.price_override),
          stock_quantity: Number(variant.stock_quantity),
          low_stock_threshold: 10,
          is_active: true,
        };
        const result = variant.id
          ? await client.from("product_variants").update(variantPayload).eq("id", variant.id)
          : await client.from("product_variants").insert(variantPayload);
        if (result.error) throw result.error;
      }

      if (editing.file) {
        const imageUrl = await uploadToCloudinary(editing.file);
        const imagePayload = {
          product_id: productId,
          image_url: imageUrl,
          alt_text: `${editing.name} product image`,
          sort_order: 0,
          is_primary: true,
        };
        const imageResult = editing.imageId
          ? await client.from("product_images").update(imagePayload).eq("id", editing.imageId)
          : await client.from("product_images").insert(imagePayload);
        if (imageResult.error) throw imageResult.error;
      }

      toast.success(editing.id ? "Product updated." : "Product added.");
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (!client || !editing?.id || !window.confirm(`Delete ${editing.name}?`)) return;
    setSaving(true);
    const { error } = await client.from("products").delete().eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setEditing(null);
    await load();
    toast.success("Product deleted.");
  }

  return (
    <div className="admin-catalogue">
      <div className="admin-catalogue-toolbar">
        <label className="admin-catalogue-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, categories or slug"
          />
        </label>
        <button className="button" type="button" onClick={() => setEditing(blankProduct())}>
          <Plus /> Add product
        </button>
      </div>

      <div className="admin-stock-summary">
        <strong>{products.length}</strong>
        <span>Products</span>
        <strong>{products.reduce((total, product) => total + totalStock(product), 0)}</strong>
        <span>Units in stock</span>
      </div>

      <div className="admin-product-grid">
        {visibleProducts.map((product) => (
          <button
            type="button"
            className="admin-product-card"
            key={product.id}
            onClick={() => setEditing(structuredClone(product))}
          >
            <div className="admin-product-card__image">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 800px) 50vw, 25vw" unoptimized />
              ) : (
                <span>No image</span>
              )}
              <span className={`badge badge--${product.status}`}>{product.status}</span>
              {product.is_sbu && <span className="badge" style={{ left: 10, right: "auto", background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>SBU</span>}
            </div>
            <div className="admin-product-card__body">
              <p className="eyebrow">{product.categoryName}</p>
              <h3>{product.name}</h3>
              <div>
                <strong>{money(product.base_price)}</strong>
                <span>{totalStock(product)} in stock</span>
              </div>
              <small>
                {product.variants.length} option{product.variants.length === 1 ? "" : "s"}
              </small>
            </div>
          </button>
        ))}
      </div>

      {editing ? (
        <div className="admin-edit-modal" role="dialog" aria-modal="true">
          <form className="admin-edit-card admin-product-form" onSubmit={saveProduct}>
            <button type="button" className="admin-edit-close" onClick={() => setEditing(null)}>
              <X />
            </button>
            <p className="eyebrow">{editing.id ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
            <h2>{editing.id ? editing.name : "Add product"}</h2>

            <div className="admin-product-form__hero">
              <label className="admin-product-upload">
                {editing.imageUrl ? (
                  <Image src={editing.imageUrl} alt={editing.name || "Product"} fill unoptimized />
                ) : (
                  <Plus />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setEditing({ ...editing, file, imageUrl: URL.createObjectURL(file) });
                  }}
                />
                <span>{editing.file ? "New image ready" : "Upload product image"}</span>
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={editing.name}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        name: event.target.value,
                        slug: editing.id ? editing.slug : slugify(event.target.value),
                      })
                    }
                    required
                  />
                </label>

                <label className="field">
                  <span>Slug</span>
                  <input
                    value={editing.slug}
                    onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
                    required
                  />
                </label>

                {/* Dropdown Checklist for Multi-Category selection */}
                <div className="field" ref={dropdownRef} style={{ position: "relative" }}>
                  <span>Categories (Multi-select)</span>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      padding: "10px 14px",
                      background: "#f9f9f9",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#111",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editing.category_ids?.length
                        ? categories
                            .filter((c) => editing.category_ids?.includes(c.id))
                            .map((c) => c.name)
                            .join(", ")
                        : "Select categories..."}
                    </span>
                    <ChevronDown size={16} />
                  </button>

                  {categoryDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        maxHeight: "220px",
                        overflowY: "auto",
                        padding: "8px",
                        marginTop: "4px",
                      }}
                    >
                      {categories.map((category) => {
                        const isSelected = editing.category_ids?.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              cursor: "pointer",
                              borderRadius: "4px",
                              background: isSelected ? "#f0f7ff" : "transparent",
                              fontWeight: isSelected ? "600" : "400",
                              fontSize: "13px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCategory(category.id)}
                            />
                            <span>{category.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="field">
                  <span>Base price</span>
                  <input
                    type="number"
                    min={0}
                    value={editing.base_price}
                    onChange={(event) => setEditing({ ...editing, base_price: Number(event.target.value) })}
                  />
                </label>

                <label className="field">
                  <span>Previous price</span>
                  <input
                    type="number"
                    min={0}
                    value={editing.compare_at_price ?? ""}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        compare_at_price: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={editing.status}
                    onChange={(event) => setEditing({ ...editing, status: event.target.value as AdminProduct["status"] })}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <label className="field full">
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={editing.description}
                    onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="admin-variants-head">
              <div>
                <p className="eyebrow">OPTIONS & STOCK</p>
                <h3>Variants</h3>
              </div>
              <button type="button" className="button" onClick={addVariant}>
                <Plus /> Add option
              </button>
            </div>

            <div className="admin-variant-list">
              {editing.variants.map((variant, index) => (
                <div className="admin-variant-row" key={variant.id ?? index}>
                  <label>
                    <span>Option or size</span>
                    <input
                      placeholder="Premium, Standard, M…"
                      value={String(variant.option_values?.option ?? variant.size ?? "")}
                      onChange={(event) => {
                        const value = event.target.value;
                        const isNamedOption = ["premium", "standard"].includes(value.toLowerCase());
                        updateVariant(index, {
                          size: isNamedOption ? null : value || null,
                          option_values: isNamedOption ? { option: value } : {},
                        });
                      }}
                    />
                  </label>
                  <label>
                    <span>Colour</span>
                    <input
                      value={variant.colour ?? ""}
                      onChange={(event) => updateVariant(index, { colour: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Price</span>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(editing.base_price)}
                      value={variant.price_override ?? ""}
                      onChange={(event) =>
                        updateVariant(index, {
                          price_override: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>Stock</span>
                    <input
                      type="number"
                      min={0}
                      value={variant.stock_quantity}
                      onChange={(event) => updateVariant(index, { stock_quantity: Number(event.target.value) })}
                    />
                  </label>
                  <button type="button" onClick={() => removeVariant(index)} aria-label={`Remove ${variantLabel(variant)}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Checkboxes: SBU and Featured Product */}
            <div style={{ display: "flex", gap: "28px", margin: "20px 0", flexWrap: "wrap", borderTop: "1px solid #eee", paddingTop: "18px" }}>
              <label className="admin-check" style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editing.is_sbu}
                  onChange={(event) => setEditing({ ...editing, is_sbu: event.target.checked })}
                  style={{ marginTop: "4px" }}
                />
                <div>
                  <strong style={{ fontSize: "15px", display: "block" }}>SBU</strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    Enable this checkbox if discount/coupon codes can be applied to this product. (Visible to admins only)
                  </span>
                </div>
              </label>

              <label className="admin-check" style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(event) => setEditing({ ...editing, featured: event.target.checked })}
                  style={{ marginTop: "4px" }}
                />
                <div>
                  <strong style={{ fontSize: "15px", display: "block" }}>Featured product</strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>Pin this item to featured collections</span>
                </div>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button className="button" disabled={saving}>
                {saving ? "Saving…" : "Save product"}
              </button>
              {editing.id ? (
                <button
                  className="admin-delete-button"
                  type="button"
                  onClick={() => void deleteProduct()}
                  disabled={saving}
                >
                  Delete product
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
