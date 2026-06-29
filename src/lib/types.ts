export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  category: string; sizes: string[]; images: string[]; stock_quantity: number;
  is_active: boolean; featured?: boolean;
};

export type CartItem = { product: Product; size: string; quantity: number };

