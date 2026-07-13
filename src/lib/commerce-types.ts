export type UserRole = "customer" | "admin";
export type ProductStatus = "draft" | "active" | "archived";
export type CartStatus = "active" | "converted" | "abandoned";
export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type FulfilmentStatus = "unfulfilled" | "processing" | "shipped" | "delivered" | "cancelled";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ProductImageRecord = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductVariantRecord = {
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

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  brand: string;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  status: ProductStatus;
  featured: boolean;
  average_rating: number;
  review_count: number;
  categories?: CategoryRecord | null;
  product_images?: ProductImageRecord[];
  product_variants?: ProductVariantRecord[];
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  category: string;
  categorySlug?: string;
  images: string[];
  variants: ProductVariantRecord[];
  sizes: string[];
  colours: string[];
  stock_quantity: number;
  is_active: boolean;
  featured: boolean;
};

export type AddressRecord = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  delivery_instructions: string | null;
  is_default: boolean;
};

export type CartLine = {
  product: StoreProduct;
  variant: ProductVariantRecord;
  quantity: number;
};

export type PriceBreakdown = {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  currency: string;
};
