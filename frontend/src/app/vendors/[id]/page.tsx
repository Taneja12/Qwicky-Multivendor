"use client";

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Vendor = {
  id: number;
  business_name: string;
  description?: string;
  canteen?: { id: number; name: string; location?: string; image_url?: string | null } | null;
};

type Product = {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  image?: string;
  image_url?: string | null;
  is_available?: boolean;
  is_veg?: boolean;
  vendor: number;
  category?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  preparation_time?: number;
};

export default function VendorPage() {
  const params = useParams();
  const id = params?.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const { data: session } = useSession();
  const accessToken = session ? (session as unknown as { access?: string }).access ?? null : null;

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [vRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/api/vendors/vendors/${id}/`),
          fetch(`${API_BASE}/api/products/products/?vendor=${id}`),
        ]);

        if (!vRes.ok) throw new Error('Vendor not found');
        if (!pRes.ok) throw new Error('Products failed');

        const vdata = await vRes.json();
        const pdataJson = await pRes.json();

        console.log('Vendor data:', vdata);
        console.log('Products response:', pdataJson);

        // Handle DRF's pagination format
        const pdata: Product[] = Array.isArray(pdataJson) ? pdataJson : 
                                pdataJson.results ? pdataJson.results : [];

        if (!mounted) return;
        setVendor(vdata);
        setProducts(pdata);
      } catch {
        if (!mounted) return;
        setError('Unable to load vendor or products.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAddToCart = async (product: Product) => {
    setAdding(product.id);
    
    try {
      // Get quantity from input
      const qtyEl = document.getElementById(`qty-${product.id}`) as HTMLInputElement | null;
      const qty = qtyEl ? parseInt(qtyEl.value || '1', 10) : 1;

      // Ensure cart exists for this canteen
      const cartRes = accessToken
        ? await api.post('/api/cart/carts/', { canteen: vendor?.canteen?.id }, { headers: { Authorization: `Bearer ${accessToken}` } })
        : await api.post('/api/cart/carts/', { canteen: vendor?.canteen?.id });
      
      const cartData = cartRes.data;
      const cartId = cartData.id;

      // Add item to cart
      const itemRes = accessToken
        ? await api.post('/api/cart/items/', { cart: cartId, product_id: product.id, quantity: qty }, { headers: { Authorization: `Bearer ${accessToken}` } })
        : await api.post('/api/cart/items/', { cart: cartId, product_id: product.id, quantity: qty });
      
      if (!itemRes || !itemRes.data) throw new Error('Failed to add item');
      
      toast.success(`${product.name} added to cart — ${qty}`);
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
      setAdding(null);
    }
  };

  if (loading) return (
    <div className="py-12 flex justify-center">
      <div className="animate-spin h-6 w-6 border-4 border-sky-500 rounded-full border-t-transparent" />
    </div>
  );
  
  if (error) return (
    <div className="py-8 text-red-600 dark:text-red-400 text-center">
      {error}
    </div>
  );
  
  if (!vendor) return (
    <div className="py-8 text-center text-gray-600 dark:text-gray-400">
      Vendor not found.
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-6">
          <div className="w-36 h-24 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image 
              src={vendor.canteen?.image_url || '/images/canteen-placeholder.jpg'} 
              alt={`${vendor.business_name} image`} 
              fill 
              className="object-cover" 
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vendor.business_name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {vendor.canteen?.name} • {vendor.canteen?.location}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Menu</h2>
        {products.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400 text-center py-8">
            No products found.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <li key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col">
                <div className="relative w-full h-36 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image 
                    src={product.image_url || '/images/product-placeholder.jpg'} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ₹{product.price}
                  </div>
                  {product.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                      {product.description}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input 
                    type="number" 
                    min={1} 
                    defaultValue={1} 
                    id={`qty-${product.id}`} 
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    aria-label={`Quantity for ${product.name}`}
                  />
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={adding === product.id}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {adding === product.id ? 'Adding...' : 'Add to cart'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}