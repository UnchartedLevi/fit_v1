import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { ProductRecord, StoreProduct } from "@/lib/commerce-types";
import { isSelectableSize } from "@/lib/product-options";

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

function mapRecordToProduct(record: ProductRecord, metadataMap?: Record<string, { is_sbu?: boolean; featured?: boolean; category_ids?: string[]; categories?: string[] }>): StoreProduct {
  const images = (record.product_images ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  const variants = (record.product_variants ?? []).filter((variant) => variant.is_active);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter((size): size is string => isSelectableSize(size)))] as string[];
  const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))] as string[];
  const stock = variants.reduce((total, variant) => total + variant.stock_quantity, 0);

  const primaryCategory = Array.isArray(record.categories) ? record.categories[0] : record.categories;
  const categoriesArray = Array.isArray(record.categories) 
    ? record.categories.map((c) => c.name) 
    : (primaryCategory ? [primaryCategory.name] : ["FITS"]);
  
  const meta = metadataMap?.[record.id];
  const is_sbu = meta?.is_sbu !== undefined ? meta.is_sbu : (record.is_sbu ?? true);
  const featured = meta?.featured !== undefined ? meta.featured : Boolean(record.featured);
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
    featured,
  };
}

type ProductMetadata = Record<string, { is_sbu?: boolean; featured?: boolean; category_ids?: string[]; categories?: string[] }>;
type CatalogueSnapshot = {
  products: StoreProduct[];
  categories: { name: string; slug: string }[];
};

const getCatalogueSnapshot = unstable_cache(
  async (): Promise<CatalogueSnapshot> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return { products: [], categories: fallbackCategories };

    const supabase = createPublicClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [productResult, categoryResult, metadataResult] = await Promise.all([
      supabase
        .from("products")
        .select("*,categories(*),product_images(*),product_variants(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("categories").select("name,slug").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("site_content").select("value").eq("key", "product_metadata").maybeSingle(),
    ]);

    if (productResult.error) throw productResult.error;
    const metadataMap = (metadataResult.data?.value as ProductMetadata) || {};
    return {
      products: ((productResult.data ?? []) as ProductRecord[]).map((record) => mapRecordToProduct(record, metadataMap)),
      categories: categoryResult.error || !categoryResult.data?.length ? fallbackCategories : categoryResult.data,
    };
  },
  ["fits-public-catalogue-v1"],
  { revalidate: 30, tags: ["fits-catalogue"] },
);

const readCatalogueSnapshot = cache(async () => {
  try {
    return await getCatalogueSnapshot();
  } catch (error) {
    console.error("Unable to load the public catalogue", error);
    return { products: [], categories: fallbackCategories } satisfies CatalogueSnapshot;
  }
});

export async function listProducts(query: ProductQuery = {}): Promise<StoreProduct[]> {
  const snapshot = await readCatalogueSnapshot();
  let products = [...snapshot.products];

  if (query.q) {
    const target = query.q.toLowerCase().trim();
    products = products.filter((product) =>
      [product.name, product.description, product.brand, product.category, ...(product.categories ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(target),
    );
  }

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

  if (query.sort === "low") products.sort((a, b) => a.price - b.price);
  else if (query.sort === "high") products.sort((a, b) => b.price - a.price);
  // Prioritize featured items first before default sorting.
  else {
    products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const snapshot = await readCatalogueSnapshot();
  return snapshot.products.find((product) => product.slug === slug) ?? null;
}

export async function listCategories() {
  const { categories } = await readCatalogueSnapshot();

  // Filter to prioritize core 7 categories while keeping other active ones
  const requestedSlugs = ["football", "basketball", "gym-fitness", "jerseys", "accessories", "bundles", "fashion-lifestyle"];
  return [...categories].sort((a, b) => {
    const idxA = requestedSlugs.indexOf(a.slug);
    const idxB = requestedSlugs.indexOf(b.slug);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

}

