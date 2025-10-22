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

type Canteen = { id: number; name: string; location?: string | null; image?: string | null };

type Vendor = { id: number; business_name: string; description?: string | null; canteen?: Canteen | null };

async function getVendors() {
  try {
    const res = await fetch(`${API_BASE}/api/vendors/vendors/`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  } catch {
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Canteens & Vendors</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vendors.map((v: Vendor) => (
          <div key={v.id} className="rounded-lg overflow-hidden shadow hover:shadow-lg transition">
            <div className="relative h-40 w-full">
               <Image 
                src={v.canteen?.image_url || '/images/canteen-placeholder.jpg'} 
                alt={`${v.business_name} image`} 
                fill 
                className="object-cover" 
              />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold">{v.business_name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{v.canteen?.name} • {v.canteen?.location}</p>
              <div className="mt-4 flex justify-between items-center">
                <Link href={`/vendors/${v.id}`} className="text-sky-600 hover:underline">View menu</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}