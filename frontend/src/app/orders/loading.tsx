// src/app/orders/loading.tsx
export default function Loading() {
  return (
    <section aria-label="Loading orders" className="max-w-4xl mx-auto space-y-8 pt-16 p-4 md:p-6 mt-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {[1, 2].map((subItem) => (
                <div key={subItem} className="flex items-start gap-4 py-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}