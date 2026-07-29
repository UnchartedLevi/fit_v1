"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/products";
import type { ProductImageRecord, ProductVariantRecord } from "@/lib/commerce-types";

const ADMIN_PRODUCTS_PER_PAGE = 8;

type CategoryOption = { id: string; name: string; slug: string };

type AdminProduct = {
    id: string;
    name: string;
    slug: string;
    description: string;
    categoryName: string;
    categoryId: string | null;
    base_price: number;
    compare_at_price: number | null;
    status: "active" | "draft" | "archived";
    featured: boolean;
    imageUrl: string;
    imageId?: string;
    sizesText: string;
    coloursText: string;
    stock_quantity: number;
    file?: File | null;
    isSaving?: boolean;
};

type RawProduct = {
    id: string;
    name: string;
    slug: string;
    description: string;
    category_id: string | null;
    base_price: number;
    compare_at_price: number | null;
    status: "active" | "draft" | "archived";
    featured: boolean;
    categories?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
    product_images?: ProductImageRecord[];
    product_variants?: ProductVariantRecord[];
};

const blankDraft = (): AdminProduct => ({
    id: "new",
    name: "",
    slug: "",
    description: "",
    categoryName: "Football",
    categoryId: null,
    base_price: 0,
    compare_at_price: null,
    status: "active",
    featured: false,
    imageUrl: "",
    sizesText: "One Size",
    coloursText: "Default",
    stock_quantity: 0,
    file: null,
    isSaving: false,
});

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function parseList(value: string, fallback: string) {
    const parsed = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length ? [...new Set(parsed)] : [fallback];
}

function normalizeProduct(product: RawProduct): AdminProduct {
    const images = product.product_images ?? [];
    const variants = (product.product_variants ?? []).filter((variant) => variant.is_active);
    const primaryImage = images.find((image) => image.is_primary) ?? images[0];
    const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))] as string[];
    const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))] as string[];
    const totalStock = variants.reduce((total, variant) => total + variant.stock_quantity, 0);
    const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        categoryName: category?.name ?? "Uncategorized",
        categoryId: product.category_id,
        base_price: product.base_price ?? 0,
        compare_at_price: product.compare_at_price,
        status: product.status,
        featured: product.featured,
        imageUrl: primaryImage?.image_url ?? "",
        imageId: primaryImage?.id,
        sizesText: sizes.length ? sizes.join(", ") : "One Size",
        coloursText: colours.length ? colours.join(", ") : "Default",
        stock_quantity: totalStock,
        file: null,
        isSaving: false,
    };
}

async function uploadToCloudinary(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary is not configured yet. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, or paste an image URL manually.");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    form.append("folder", "fits/products");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
    });
    const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message || "Cloudinary upload failed.");
    return payload.secure_url;
}

export function AdminProductsEditor() {
    const client = useMemo(() => createClient(), []);
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [draft, setDraft] = useState<AdminProduct>(() => blankDraft());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const cloudinaryConfigured = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const loadProducts = useCallback(
        async () => {
            if (!client) {
                setError("Missing Supabase environment variables.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const [{ data: categoryData, error: categoryError }, { data: productData, error: productError }] = await Promise.all([
                client.from("categories").select("id,name,slug").order("sort_order", { ascending: true }),
                client
                    .from("products")
                    .select(
                        `id,name,slug,description,category_id,base_price,compare_at_price,status,featured,categories(id,name,slug),product_images(id,product_id,image_url,alt_text,sort_order,is_primary),product_variants(id,product_id,sku,size,colour,option_values,price_override,stock_quantity,low_stock_threshold,is_active)`,
                    )
                    .order("created_at", { ascending: false }),
            ]);

            if (categoryError) {
                setError(categoryError.message);
                setLoading(false);
                return;
            }
            if (productError) {
                setError(productError.message);
                setLoading(false);
                return;
            }

            setCategories((categoryData ?? []) as CategoryOption[]);
            setProducts(((productData ?? []) as unknown as RawProduct[]).map(normalizeProduct));
            setPage(1);
            setLoading(false);
        },
        [client],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadProducts();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadProducts]);

    const updateProductState = (id: string, changes: Partial<AdminProduct>) => {
        setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, ...changes } : product)));
    };

    const setSaving = (id: string, isSaving: boolean) => {
        if (id === "new") setDraft((current) => ({ ...current, isSaving }));
        else updateProductState(id, { isSaving });
    };

    const handleFileChange = (product: AdminProduct, file: File | null) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (product.id === "new") setDraft((current) => ({ ...current, file, imageUrl: preview }));
        else updateProductState(product.id, { file, imageUrl: preview });
    };

    const getCategoryId = async (name: string) => {
        if (!client) throw new Error("Supabase is not configured.");
        const cleanName = name.trim() || "Uncategorized";
        const slug = slugify(cleanName) || "uncategorized";
        const found = categories.find((category) => category.slug === slug || category.name.toLowerCase() === cleanName.toLowerCase());
        if (found) return found.id;

        const { data, error: insertError } = await client
            .from("categories")
            .upsert({ name: cleanName, slug, description: `${cleanName} products`, is_active: true }, { onConflict: "slug" })
            .select("id,name,slug")
            .single();
        if (insertError || !data) throw insertError ?? new Error("Could not create category.");
        setCategories((current) => [...current, data as CategoryOption]);
        return data.id as string;
    };

    const saveVariants = async (product: AdminProduct, productId: string, slug: string) => {
        if (!client) throw new Error("Supabase is not configured.");
        const sizes = parseList(product.sizesText, "One Size");
        const colours = parseList(product.coloursText, "Default");
        const variants = sizes.flatMap((size) => colours.map((colour) => ({ size, colour })));
        const baseStock = Math.floor(Number(product.stock_quantity) / variants.length);
        const remainder = Number(product.stock_quantity) % variants.length;

        await client.from("product_variants").update({ is_active: false }).eq("product_id", productId);

        const rows = variants.map((variant, index) => ({
            product_id: productId,
            sku: `FITS-${slug}-${slugify(variant.size)}-${slugify(variant.colour)}`.toUpperCase().slice(0, 80),
            size: variant.size,
            colour: variant.colour,
            stock_quantity: baseStock + (index < remainder ? 1 : 0),
            low_stock_threshold: 3,
            is_active: true,
            option_values: { size: variant.size, colour: variant.colour },
        }));

        const { error: variantError } = await client.from("product_variants").upsert(rows, { onConflict: "sku" });
        if (variantError) throw variantError;
    };

    const saveImage = async (product: AdminProduct, productId: string, imageId?: string) => {
        if (!client) throw new Error("Supabase is not configured.");
        let imageUrl = product.imageUrl.trim();
        if (product.file) imageUrl = await uploadToCloudinary(product.file);
        if (!imageUrl || imageUrl.startsWith("blob:")) return;

        if (imageId) {
            const { error: imageError } = await client
                .from("product_images")
                .update({ image_url: imageUrl, alt_text: `${product.name} image`, is_primary: true })
                .eq("id", imageId);
            if (imageError) throw imageError;
        } else {
            const { error: imageError } = await client.from("product_images").insert({
                product_id: productId,
                image_url: imageUrl,
                alt_text: `${product.name} image`,
                sort_order: 0,
                is_primary: true,
            });
            if (imageError) throw imageError;
        }
    };

    const saveProduct = async (product: AdminProduct) => {
        if (!client) {
            toast.error("Supabase variables are not configured.");
            return;
        }
        if (!product.name.trim()) {
            toast.error("Product name is required.");
            return;
        }

        setSaving(product.id, true);

        try {
            const slug = slugify(product.slug || product.name);
            const categoryId = await getCategoryId(product.categoryName);
            const payload = {
                name: product.name.trim(),
                slug,
                description: product.description.trim(),
                category_id: categoryId,
                base_price: Number(product.base_price),
                compare_at_price: product.compare_at_price !== null && Number(product.compare_at_price) > 0 ? Number(product.compare_at_price) : null,
                status: product.status,
                featured: product.featured,
            };

            const productId = product.id === "new" ? undefined : product.id;
            const { data, error: productError } = productId
                ? await client.from("products").update(payload).eq("id", productId).select("id").single()
                : await client.from("products").insert(payload).select("id").single();
            if (productError || !data) throw productError ?? new Error("Could not save product.");

            const savedId = data.id as string;
            await saveVariants(product, savedId, slug);
            await saveImage(product, savedId, product.imageId);

            toast.success(`Saved ${product.name}`);
            if (product.id === "new") setDraft(blankDraft());
            await loadProducts();
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : "Update failed.");
        } finally {
            setSaving(product.id, false);
        }
    };

    const deleteProduct = async (product: AdminProduct) => {
        if (!client) return;
        if (!window.confirm(`Delete ${product.name}? This removes it from the catalogue.`)) return;
        updateProductState(product.id, { isSaving: true });
        const { error: deleteError } = await client.from("products").delete().eq("id", product.id);
        if (deleteError) {
            const { error: archiveError } = await client.from("products").update({ status: "archived" }).eq("id", product.id);
            if (archiveError) toast.error(archiveError.message);
            else toast.success(`${product.name} archived instead of deleted because linked records exist.`);
        } else {
            toast.success(`${product.name} deleted`);
        }
        await loadProducts();
    };

    const renderEditorRow = (product: AdminProduct, isDraft = false) => (
        <tr key={product.id}>
            <td>
                <input className="admin-input wide" value={product.name} placeholder="Product name" onChange={(event) => (isDraft ? setDraft({ ...product, name: event.target.value }) : updateProductState(product.id, { name: event.target.value }))} />
                <input className="admin-input wide muted-input" value={product.slug} placeholder="auto-slug" onChange={(event) => (isDraft ? setDraft({ ...product, slug: event.target.value }) : updateProductState(product.id, { slug: event.target.value }))} />
                <textarea className="admin-textarea" value={product.description} placeholder="Description" rows={3} onChange={(event) => (isDraft ? setDraft({ ...product, description: event.target.value }) : updateProductState(product.id, { description: event.target.value }))} />
            </td>
            <td>
                <input className="admin-input" list="admin-categories" value={product.categoryName} onChange={(event) => (isDraft ? setDraft({ ...product, categoryName: event.target.value }) : updateProductState(product.id, { categoryName: event.target.value }))} />
            </td>
            <td>
                <input className="admin-input" type="number" min={0} value={product.base_price} onChange={(event) => (isDraft ? setDraft({ ...product, base_price: Number(event.target.value) }) : updateProductState(product.id, { base_price: Number(event.target.value) }))} />
                <input className="admin-input" type="number" min={0} placeholder="Previous" value={product.compare_at_price ?? ""} onChange={(event) => (isDraft ? setDraft({ ...product, compare_at_price: event.target.value ? Number(event.target.value) : null }) : updateProductState(product.id, { compare_at_price: event.target.value ? Number(event.target.value) : null }))} />
                <small>{money(Number(product.base_price) || 0)}</small>
            </td>
            <td>
                <input className="admin-input" type="number" min={0} value={product.stock_quantity} onChange={(event) => (isDraft ? setDraft({ ...product, stock_quantity: Number(event.target.value) }) : updateProductState(product.id, { stock_quantity: Number(event.target.value) }))} />
                <input className="admin-input" value={product.sizesText} placeholder="S, M, L" onChange={(event) => (isDraft ? setDraft({ ...product, sizesText: event.target.value }) : updateProductState(product.id, { sizesText: event.target.value }))} />
                <input className="admin-input" value={product.coloursText} placeholder="Black, White" onChange={(event) => (isDraft ? setDraft({ ...product, coloursText: event.target.value }) : updateProductState(product.id, { coloursText: event.target.value }))} />
            </td>
            <td>
                <div className="admin-image-cell">
                    {product.imageUrl ? <img className="admin-image-preview" src={product.imageUrl} alt={product.name || "Product preview"} /> : <div className="admin-image-placeholder">No image</div>}
                    <input className="admin-input wide" value={product.imageUrl.startsWith("blob:") ? "" : product.imageUrl} placeholder="Cloudinary/image URL" onChange={(event) => (isDraft ? setDraft({ ...product, imageUrl: event.target.value, file: null }) : updateProductState(product.id, { imageUrl: event.target.value, file: null }))} />
                    <input className="admin-file-input" type="file" accept="image/*" onChange={(event) => handleFileChange(product, event.target.files?.[0] ?? null)} />
                </div>
            </td>
            <td>
                <label className="admin-check"><input type="checkbox" checked={product.featured} onChange={(event) => (isDraft ? setDraft({ ...product, featured: event.target.checked }) : updateProductState(product.id, { featured: event.target.checked }))} /> Featured</label>
                <label className="admin-check"><input type="checkbox" checked={product.status === "active"} onChange={(event) => (isDraft ? setDraft({ ...product, status: event.target.checked ? "active" : "draft" }) : updateProductState(product.id, { status: event.target.checked ? "active" : "draft" }))} /> Active</label>
                <button className="button admin-save-button" type="button" onClick={() => saveProduct(product)} disabled={product.isSaving}>{product.isSaving ? "Saving…" : isDraft ? "Create" : "Save"}</button>
                {!isDraft ? <button className="admin-delete-button" type="button" onClick={() => deleteProduct(product)} disabled={product.isSaving}>Delete</button> : null}
            </td>
        </tr>
    );

    if (loading) return <div>Loading products…</div>;
    if (error) return <div className="admin-error">{error}</div>;

    const totalPages = Math.max(1, Math.ceil(products.length / ADMIN_PRODUCTS_PER_PAGE));
    const pagedProducts = products.slice((page - 1) * ADMIN_PRODUCTS_PER_PAGE, page * ADMIN_PRODUCTS_PER_PAGE);

    return (
        <div className="admin-editor">
            <datalist id="admin-categories">
                {categories.map((category) => <option key={category.id} value={category.name} />)}
            </datalist>
            <div className="admin-editor-toolbar">
                <p>{products.length} products · Page {page} of {totalPages}</p>
                <span className={cloudinaryConfigured ? "cloudinary-status ready" : "cloudinary-status"}>
                    {cloudinaryConfigured ? "Cloudinary uploads enabled" : "Cloudinary upload preset missing"}
                </span>
            </div>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock / Options</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderEditorRow(draft, true)}
                        {pagedProducts.map((product) => renderEditorRow(product))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 ? (
                <div className="pagination admin-pagination" aria-label="Admin product pagination">
                    <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                        <button key={item} type="button" className={item === page ? "active" : ""} onClick={() => setPage(item)} aria-current={item === page ? "page" : undefined}>{item}</button>
                    ))}
                    <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
                </div>
            ) : null}
        </div>
    );
}

