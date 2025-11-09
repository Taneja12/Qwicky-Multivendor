import React from 'react';
// import api from '../../../lib/api';
import Image from 'next/image';
// import { toast } from 'react-hot-toast';
import AddToCart from './AddToCart';

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

async function getVendorData(id: string): Promise<Vendor> {
  const res = await fetch(`${API_BASE}/api/vendors/vendors/${id}/`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });

  if (!res.ok) {
    throw new Error('Failed to fetch vendor');
  }

  return res.json();
}

async function getProducts(id: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products/products/?vendor=${id}`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  
  // Handle DRF's pagination format
  return Array.isArray(data) ? data : data.results ? data.results : [];
}

export default async function VendorPage({ params }: { params: { id: string } }) {
  const {id } = await params;
  let vendor: Vendor;
  let products: Product[];

  try {
    [vendor, products] = await Promise.all([
      getVendorData(id),
      getProducts(id)
    ]);
  } catch (error) {
    // This will be caught by error.tsx
    throw error;
  }

  return (
    <div className="space-y-6 pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-6">
          <div className="w-36 h-24 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image 
              src={vendor.canteen?.image_url || '/images/canteen-placeholder.jpg'} 
              alt={`${vendor.business_name} image`} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                {/* Client component for interactive cart functionality */}
                <AddToCart product={product} vendor={vendor} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}