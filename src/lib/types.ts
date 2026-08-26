export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  colour: string | null;
  option_values: Record<string, unknown>;
  price_override: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};

export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  category: string; categorySlug?: string; sizes: string[]; images: string[]; stock_quantity: number;
  is_active: boolean; featured?: boolean; compareAtPrice?: number | null; currency?: string; brand?: string; variants?: ProductVariant[]; colours?: string[];
};

export type CartItem = { product: Product; variantId: string; option: string; size: string | null; quantity: number; unitPrice: number };
