"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Vendor = {
  id: number;
  user: number | null;
  business_name: string;
  description?: string;
  is_open?: boolean;
  avg_preparation_time?: number;
  canteen?: {
    id: number;
    name: string;
    location?: string;
    image_url?: string | null;
  } | null;
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    fetch(`${API_BASE}/api/vendors/vendors/`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        
        // Debug: log the API response
        console.log('API Response:', data);
        
        // Handle different response formats
        let vendorsArray: Vendor[] = [];
        
        if (Array.isArray(data)) {
          // If response is directly an array
          vendorsArray = data;
        } else if (data && Array.isArray(data.results)) {
          // If response has pagination format { results: [...] }
          vendorsArray = data.results;
        } else if (data && Array.isArray(data.vendors)) {
          // If response has { vendors: [...] } format
          vendorsArray = data.vendors;
        } else if (data && typeof data === 'object') {
          // If response is a single object, wrap it in array
          vendorsArray = [data];
        }
        
        console.log('Processed vendors:', vendorsArray);
        
        if (mounted) {
          setVendors(vendorsArray);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch vendors', err);
        if (mounted) {
          setError('Unable to load vendors: ' + err.message);
          setVendors([]); // Ensure vendors is always an array
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    // Ensure filtered is always an array
    if (!Array.isArray(vendors)) {
      console.warn('Vendors is not an array:', vendors);
      return [];
    }
    
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    
    return vendors.filter((v) =>
      v.business_name.toLowerCase().includes(q) || 
      (v.canteen?.name || '').toLowerCase().includes(q)
    );
  }, [query, vendors]);

  // Safe array check for rendering
  const vendorsToRender = Array.isArray(filtered) ? filtered : [];

  return (
    <div className="space-y-12 pt-16">
      <header className="relative bg-gradient-to-br from-emerald-500 via-emerald-400 to-sky-400 rounded-xl p-8 text-white overflow-hidden animate-fade-in">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-black/5" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} 
        />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left content section */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Order ahead from campus canteens
              </h1>
              
              <p className="mt-4 text-xl text-white/90">
                Fast pickup, hygienic kitchens, and student discounts.
              </p>

              {/* Search section */}
              <div className="mt-8 max-w-lg mx-auto md:mx-0">
                <label htmlFor="search" className="sr-only">Search for canteens, vendors, or locations</label>
                <div className="flex items-center bg-white/95 backdrop-blur rounded-lg shadow-lg transition-shadow duration-300 hover:shadow-xl">
                  <div className="pl-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    id="search"
                    className="w-full px-4 py-4 bg-transparent text-gray-900 placeholder-gray-500 outline-none"
                    placeholder="Search for canteens, vendors, or locations..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-6 py-4 bg-emerald-600 text-white font-medium rounded-r-lg hover:bg-emerald-700 transition-colors duration-200"
                    aria-label="Submit search"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Right image section */}
            <div className="w-full md:w-2/5 max-w-lg">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:scale-[1.02]">
                <Image 
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80" 
                  alt="Students enjoying lunch together in campus cafeteria" 
                  fill 
                  className="object-cover"
                  priority 
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Popular Canteens</h2>
          <div className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${vendorsToRender.length} results`}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {error && (
            <div className="col-span-full text-red-600 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          )}

          {loading && (
            <div className="col-span-full text-gray-600 text-center py-8">
              Loading vendors...
            </div>
          )}

          {!loading && vendorsToRender.length === 0 && (
            <div className="col-span-full text-gray-600 text-center py-8">
              No vendors found. {!error && 'The API might be returning an unexpected format.'}
            </div>
          )}

          {vendorsToRender.map((vendor) => (
            <article key={vendor.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="relative h-44 w-full rounded-t-lg overflow-hidden bg-gray-200">
                <Image
                  src={vendor.canteen?.image_url || '/images/canteen-placeholder.jpg'}
                  alt={`${vendor.business_name} image`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold">{vendor.business_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {vendor.canteen?.name} • {vendor.canteen?.location || 'No location'}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm ${
                      vendor.is_open 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.is_open ? 'Open' : 'Closed'}
                    </span>
                    <span className="text-xs text-gray-500">(reviews)</span>
                  </div>

                  <button
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700 transition-colors"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}