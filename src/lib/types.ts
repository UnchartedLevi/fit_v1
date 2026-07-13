export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  category: string; categorySlug?: string; sizes: string[]; images: string[]; stock_quantity: number;
  is_active: boolean; featured?: boolean; compareAtPrice?: number | null; currency?: string; brand?: string; variants?: unknown[]; colours?: string[];
};

export type CartItem = { product: Product; size: string; quantity: number };
