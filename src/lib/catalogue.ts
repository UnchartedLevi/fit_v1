import { createClient } from "@/lib/supabase/server";
import { ProductRecord, StoreProduct } from "@/lib/commerce-types";

type ProductQuery = {
  category?: string;
  q?: string;
  size?: string;
  colour?: string;
  sort?: string;
};

function mapRecordToProduct(record: ProductRecord): StoreProduct {
  const images = (record.product_images ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  const variants = (record.product_variants ?? []).filter((variant) => variant.is_active);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))] as string[];
  const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))] as string[];
  const stock = variants.reduce((total, variant) => total + variant.stock_quantity, 0);

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
    category: record.categories?.name ?? "FITS",
    categorySlug: record.categories?.slug,
    images,
    variants,
    sizes: sizes.length ? sizes : ["One Size"],
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

  const { data, error } = await request.limit(100);
  if (error || !data) return [];

  let products = (data as ProductRecord[]).map(mapRecordToProduct);
  if (query.category) products = products.filter((product) => product.categorySlug === query.category || product.category === query.category);
  if (query.size) products = products.filter((product) => product.sizes.includes(query.size as string));
  if (query.colour) products = products.filter((product) => product.colours.includes(query.colour as string));
  return products;
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
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
    .single();

  if (error || !data) return null;

  return mapRecordToProduct(data as ProductRecord);
}

export async function listCategories() {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("name,slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}
