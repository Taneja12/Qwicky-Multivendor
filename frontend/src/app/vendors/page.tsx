import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getImageUrl(raw?: string | null) {
  if (!raw) return '/images/canteen-placeholder.jpg';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${API_BASE}${raw}`;
  return `${API_BASE}/${raw}`;
}

type Canteen = { 
  id: number; 
  name: string; 
  location?: string | null; 
  image?: string | null;
  image_url?: string | null;
};

type Vendor = { 
  id: number; 
  business_name: string; 
  description?: string | null; 
  canteen?: Canteen | null;
  canteen_details?: Canteen | null;
};

async function getVendors() {
  try {
    const res = await fetch(`${API_BASE}/api/vendors/vendors/`, { cache: 'no-store' });
    
    if (!res.ok) {
      console.error('Failed to fetch vendors, status:', res.status);
      return [];
    }

    const data = await res.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    } else if (data && Array.isArray(data.vendors)) {
      return data.vendors;
    } else if (data && typeof data === 'object') {
      return [data];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  // Ensure vendors is always an array for safe mapping
  const safeVendors = Array.isArray(vendors) ? vendors : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Canteens & Vendors</h1>
      
      {safeVendors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No vendors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {safeVendors.map((v: Vendor) => {
            // Safely access canteen data
            const canteen = v.canteen || v.canteen_details;
            const imageUrl = canteen?.image_url || canteen?.image;

            return (
              <div key={v.id} className="rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                <div className="relative h-40 w-full">
                  <Image 
                    src={getImageUrl(imageUrl)} 
                    alt={`${v.business_name} image`} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="p-4 bg-white dark:bg-gray-800">
                  <h2 className="text-lg font-semibold">{v.business_name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {canteen?.name || 'No canteen'} • {canteen?.location || 'No location'}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <Link href={`/vendors/${v.id}`} className="text-sky-600 hover:underline">View menu</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}