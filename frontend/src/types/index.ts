export interface Product {
  id: number;
  name: string;
  price: string;
  image_url?: string | null;
  description?: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  note?: string;
  total_price?: number;
}

export interface Canteen {
  id: number;
  name: string;
  business_name?: string;
  description?: string;
}

export interface Cart {
  id: number;
  canteen: number | Canteen | null;
  items: CartItem[];
  total_price?: number;
  item_count?: number;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}