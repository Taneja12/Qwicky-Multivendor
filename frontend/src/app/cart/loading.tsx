// src/app/cart/loading.tsx
export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto pt-16 px-4">
      

      {/* Single Cart Item Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
        {/* Vendor Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
        </div>

        {/* Single Product */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
            
            {/* Product Details */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-36"></div>
            </div>

            {/* Quantity and Price */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Cart Footer */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Order Summary Skeleton */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-14"></div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-4">
          <div className="flex justify-between">
            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-lg w-full"></div>
        </div>
      </div>
    </main>
  );
}