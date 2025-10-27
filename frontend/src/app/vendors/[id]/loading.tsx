// src/app/vendors/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6 pt-16">
      {/* Vendor Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-36 h-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
        </div>
      </div>

      {/* Menu Section Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        
        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              {/* Product Image Skeleton */}
              <div className="w-full h-36 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
              
              {/* Product Info Skeleton */}
              <div className="space-y-2 mb-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
              
              {/* Add to Cart Section Skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}