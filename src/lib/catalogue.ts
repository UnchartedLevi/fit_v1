import { createClient } from "@/lib/supabase/server";
import { ProductRecord, StoreProduct } from "@/lib/commerce-types";

type ProductQuery = {
  category?: string;
  q?: string;
  size?: string;
  colour?: string;
  sort?: string;
};

const fallbackCategories = [
  { name: "Football", slug: "football" },
  { name: "Basketball", slug: "basketball" },
  { name: "Gym & Fitness", slug: "gym-fitness" },
  { name: "Jerseys", slug: "jerseys" },
  { name: "Accessories", slug: "accessories" },
  { name: "Bundles", slug: "bundles" },
  { name: "Fashion & Lifestyle", slug: "fashion-lifestyle" },
];

function mapRecordToProduct(record: ProductRecord, metadataMap?: Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>): StoreProduct {
  const images = (record.product_images ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  const variants = (record.product_variants ?? []).filter((variant) => variant.is_active);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter((size) => size && !["premium", "standard"].includes(size.toLowerCase())))] as string[];
  const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))] as string[];
  const stock = variants.reduce((total, variant) => total + variant.stock_quantity, 0);

  const primaryCategory = Array.isArray(record.categories) ? record.categories[0] : record.categories;
  const categoriesArray = Array.isArray(record.categories) 
    ? record.categories.map((c) => c.name) 
    : (primaryCategory ? [primaryCategory.name] : ["FITS"]);
  
  const meta = metadataMap?.[record.id];
  const is_sbu = meta?.is_sbu !== undefined ? meta.is_sbu : (record.is_sbu ?? true);
  const category_ids = meta?.category_ids || record.category_ids || (record.category_id ? [record.category_id] : []);
  const extraCategories = meta?.categories || [];
  const mergedCategories = [...new Set([...categoriesArray, ...extraCategories])];

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    shortDescription: record.short_description ?? undefined,
    brand: record.brand,
    price: record.base_price,
    compareAtPrice: record.compare_at_price,
    currency: record.currency,
    category: mergedCategories[0] ?? primaryCategory?.name ?? "FITS",
    categorySlug: primaryCategory?.slug,
    category_ids,
    categories: mergedCategories,
    is_sbu,
    images,
    variants,
    sizes,
    colours,
    stock_quantity: stock,
    is_active: record.status === "active",
    featured: record.featured,
  };
}

export async function listProducts(query: ProductQuery = {}): Promise<StoreProduct[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let request = supabase
    .from("products")
    .select(
      `
        *,
        categories(*),
        product_images(*),
        product_variants(*)
      `,
    )
    .eq("status", "active");

  if (query.q) request = request.textSearch("name", query.q, { type: "websearch" });
  if (query.sort === "low") request = request.order("base_price", { ascending: true });
  else if (query.sort === "high") request = request.order("base_price", { ascending: false });
  else request = request.order("created_at", { ascending: false });

  const [{ data, error }, { data: contentData }] = await Promise.all([
    request.limit(100),
    supabase.from("site_content").select("value").eq("key", "product_metadata").maybeSingle(),
  ]);

  if (error || !data) return [];

  const metadataMap = (contentData?.value as Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>) || {};
  let products = (data as ProductRecord[]).map((r) => mapRecordToProduct(r, metadataMap));

  if (query.category) {
    const target = query.category.toLowerCase().trim();
    products = products.filter((product) => {
      const matchSlug = product.categorySlug?.toLowerCase() === target;
      const matchCat = product.category?.toLowerCase() === target;
      const matchMulti = product.categories?.some((c) => c.toLowerCase() === target);
      return matchSlug || matchCat || matchMulti;
    });
  }

  if (query.size) products = products.filter((product) => product.sizes.includes(query.size as string));
  if (query.colour) products = products.filter((product) => product.colours.includes(query.colour as string));
  return products;
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const [{ data, error }, { data: contentData }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
          *,
          categories(*),
          product_images(*),
          product_variants(*)
        `,
      )
      .eq("slug", slug)
      .eq("status", "active")
      .single(),
    supabase.from("site_content").select("value").eq("key", "product_metadata").maybeSingle(),
  ]);

  if (error || !data) return null;

  const metadataMap = (contentData?.value as Record<string, { is_sbu?: boolean; category_ids?: string[]; categories?: string[] }>) || {};
  return mapRecordToProduct(data as ProductRecord, metadataMap);
}

export async function listCategories() {
  const supabase = await createClient();
  if (!supabase) return fallbackCategories;

  const { data, error } = await supabase
    .from("categories")
    .select("name,slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || !data.length) return fallbackCategories;

  // Filter to prioritize core 7 categories while keeping other active ones
  const requestedSlugs = ["football", "basketball", "gym-fitness", "jerseys", "accessories", "bundles", "fashion-lifestyle"];
  const sorted = [...data].sort((a, b) => {
    const idxA = requestedSlugs.indexOf(a.slug);
    const idxB = requestedSlugs.indexOf(b.slug);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}

