"use client";

import React, { useState } from 'react';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type Product = {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  image_url?: string | null;
};

type Vendor = {
  id: number;
  business_name: string;
  canteen?: { id: number; name: string; location?: string; image_url?: string | null } | null;
};

export default function AddToCart({ product, vendor }: { product: Product; vendor: Vendor }) {
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { data: session } = useSession();
  const accessToken = session ? (session as unknown as { access?: string }).access ?? null : null;

  const handleAddToCart = async () => {
    setAdding(true);
    
    try {
      // Ensure cart exists for this canteen
      const cartRes = accessToken
        ? await api.post('/api/cart/carts/', { canteen: vendor?.canteen?.id }, { headers: { Authorization: `Bearer ${accessToken}` } })
        : await api.post('/api/cart/carts/', { canteen: vendor?.canteen?.id });
      
      const cartData = cartRes.data;
      const cartId = cartData.id;

      // Add item to cart
      const itemRes = accessToken
        ? await api.post('/api/cart/items/', { cart: cartId, product_id: product.id, quantity }, { headers: { Authorization: `Bearer ${accessToken}` } })
        : await api.post('/api/cart/items/', { cart: cartId, product_id: product.id, quantity });
      
      if (!itemRes || !itemRes.data) throw new Error('Failed to add item');
      
      toast.success(`${product.name} added to cart — ${quantity}`);
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { status?: number } } | undefined;
      
      if (axiosErr?.response?.status === 401) {
        toast.error('Please sign in to add items to cart');
        window.location.href = '/login';
        return;
      }
      
      toast.error('Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <input 
        type="number" 
        min={1} 
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        aria-label={`Quantity for ${product.name}`}
      />
      <button
        onClick={handleAddToCart}
        disabled={adding}
        className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
        aria-label={`Add ${product.name} to cart`}
      >
        {adding ? 'Adding...' : 'Add to cart'}
      </button>
    </div>
  );
}