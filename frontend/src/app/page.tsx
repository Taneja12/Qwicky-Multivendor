"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

type Product = {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  image?: any; 
  image_url?: string | null;
  is_available?: boolean;
  is_veg?: boolean;
  vendor: number| { // Can be ID or object
    id: number;
    business_name: string;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  preparation_time?: number;
};

// Vendor Skeleton Component
const VendorSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
      <div className="relative h-44 w-full rounded-t-lg overflow-hidden bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

// Product Skeleton Component
const ProductSkeleton = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse p-3">
        <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse p-4">
      <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mb-3"></div>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );
};

// Product Card Component
// Product Card Component
// Product Card Component
const ProductCard = ({ product, compact = false }: { product: Product; compact?: boolean }) => {
  const router = useRouter();
  const { data: session } = useSession();

  // In your ProductCard component, replace the handleProductClick function:
const handleProductClick = () => {

  // Navigate to product detail page instead of vendor page
  router.push(`/product/${product.id}`);
};

  // Safely get image URL - handle Cloudinary objects and various formats
  const getProductImageUrl = () => {
    // If image_url is already a string, use it
    if (typeof product.image_url === 'string') {
      return product.image_url;
    }
    
    // If image is a Cloudinary object with url property
    if (product.image && typeof product.image === 'object' && product.image.url) {
      return product.image.url;
    }
    
    // If image is a Cloudinary object with secure_url property
    if (product.image && typeof product.image === 'object' && product.image.secure_url) {
      return product.image.secure_url;
    }
    
    // If image is already a string URL
    if (typeof product.image === 'string') {
      return product.image;
    }
    
    // Fallback to placeholder
    return '/images/product-placeholder.jpg';
  };

  const productImage = getProductImageUrl();

  if (compact) {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-3"
        onClick={handleProductClick}
      >
        <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-200 mb-2">
          <Image
            src={productImage}
            alt={product.name}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/product-placeholder.jpg';
            }}
          />
        </div>
        <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
        <p className="text-emerald-600 font-semibold text-sm">₹{product.price}</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4"
      onClick={handleProductClick}
    >
      <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-200 mb-3">
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/product-placeholder.jpg';
          }}
        />
      </div>
      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {product.description}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-emerald-600 font-bold text-lg">₹{product.price}</span>
        <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
};

// Personalized Recommendations Section
const PersonalizedSection = ({ 
  title = "Recommended For You", 
  maxItems = 8,
  variant = 'default'
}: { 
  title?: string; 
  maxItems?: number;
  variant?: 'default' | 'compact';
}) => {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.access) {
      fetchRecommendations();
    } else {
      // For non-logged in users, show trending
      fetchTrending();
    }
  }, [session]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/recommendations/?limit=${maxItems}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // console.log('Recommendations API response:', data);
        
        // Debug: Check what's actually in the response
        if (data.recommendations) {
          // console.log('Recommendations array:', data.recommendations);
          data.recommendations.forEach((item: any, index: number) => {
            // console.log(`Product ${index}:`, item);
            // console.log(`Product ${index} vendor:`, item.vendor);
          });
        }
        
        setRecommendations(data.recommendations || []);
      } else {
        console.error('API response not OK:', response.status);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      // Fallback to trending
      fetchTrending();
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      // console.log('Fetching trending products...');
      const response = await fetch(
        `${API_BASE}/api/recommendations/trending/?limit=${maxItems}`
      );
      if (response.ok) {
        const data = await response.json();
        // console.log('Trending API response:', data);
        setRecommendations(data.products || []);
      } else {
        console.error('Trending API response not OK:', response.status);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch trending products:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <section className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
        <div className={`grid gap-4 ${
          variant === 'compact' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {[...Array(maxItems)].map((_, i) => (
            <ProductSkeleton key={i} compact={variant === 'compact'} />
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
      <div className={`grid gap-4 ${
        variant === 'compact' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {recommendations.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            compact={variant === 'compact'} 
          />
        ))}
      </div>
    </section>
  );
};

// Quick Reorder Section
const QuickReorderSection = ({ 
  title = "Quick Reorder",
  maxItems = 6
}: { 
  title?: string; 
  maxItems?: number;
}) => {
  const { data: session } = useSession();
  const [quickReorder, setQuickReorder] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.access) {
      fetchQuickReorder();
    }
  }, [session]);

  const fetchQuickReorder = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/recommendations/quick-reorder/`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setQuickReorder(data.quick_reorder || []);
      }
    } catch (error) {
      console.error('Failed to fetch quick reorder:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.access) {
    return null; // Only show for logged-in users
  }

  if (loading) {
    return (
      <section className="my-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(maxItems)].map((_, i) => (
            <ProductSkeleton key={i} compact={true} />
          ))}
        </div>
      </section>
    );
  }

  if (quickReorder.length === 0) {
    return null;
  }

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickReorder.map((product) => (
          <ProductCard key={product.id} product={product} compact={true} />
        ))}
      </div>
    </section>
  );
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
        
        // Handle different response formats
        let vendorsArray: Vendor[] = [];
        
        if (Array.isArray(data)) {
          vendorsArray = data;
        } else if (data && Array.isArray(data.results)) {
          vendorsArray = data.results;
        } else if (data && Array.isArray(data.vendors)) {
          vendorsArray = data.vendors;
        } else if (data && typeof data === 'object') {
          vendorsArray = [data];
        }
        
        if (mounted) {
          setVendors(vendorsArray);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch vendors', err);
        if (mounted) {
          setError('Unable to load vendors: ' + err.message);
          setVendors([]);
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
    if (!Array.isArray(vendors)) {
      return [];
    }
    
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    
    return vendors.filter((v) =>
      v.business_name.toLowerCase().includes(q) || 
      (v.canteen?.name || '').toLowerCase().includes(q)
    );
  }, [query, vendors]);

  const vendorsToRender = Array.isArray(filtered) ? filtered : [];

  return (
    <div className="space-y-12 pt-16">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-emerald-500 via-emerald-400 to-sky-400 rounded-xl p-8 text-white overflow-hidden">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <style jsx global>{`
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Reorder Section (for logged-in users) */}
        <QuickReorderSection />

        {/* Personalized Recommendations */}
        <PersonalizedSection 
          title="Recommended For You"
          maxItems={8}
        />

        {/* Popular Canteens Section - MAIN CONTENT */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Canteens</h2>
            <div className="text-sm text-gray-500">
              {loading ? 'Loading...' : `Showing ${vendorsToRender.length} canteens`}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {error && (
              <div className="col-span-full text-red-600 bg-red-50 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <VendorSkeleton key={item} />
                ))}
              </>
            )}

            {!loading && vendorsToRender.length === 0 && (
              <div className="col-span-full text-gray-600 text-center py-8">
                No vendors found. {!error && 'The API might be returning an unexpected format.'}
              </div>
            )}

            {!loading && vendorsToRender.map((vendor) => (
              <article key={vendor.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="relative h-44 w-full rounded-t-lg overflow-hidden bg-gray-200">
                  <Image
                    src={vendor.canteen?.image_url || '/images/canteen-placeholder.jpg'}
                    alt={`${vendor.business_name} image`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{vendor.business_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
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

        {/* Additional Recommendations */}
        <PersonalizedSection 
          title="You Might Like"
          maxItems={6}
          variant="compact"
        />
      </div>
    </div>
  );
}