// src/app/vendors/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
      </div>

      {/* Vendors grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="rounded-lg overflow-hidden shadow bg-white dark:bg-gray-800 animate-pulse">
            {/* Image skeleton */}
            <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-700"></div>
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              
              {/* Button skeleton */}
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}