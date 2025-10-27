import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';
import Link from 'next/link';

interface OrderItemCustomization {
  option: number;
  name_at_time: string;
  price_at_time: string;
}

interface ProductDetails {
  id: number;
  name: string;
  image_url?: string;
  is_veg: boolean;
}

interface OrderItem {
  id: number;
  product: number;
  product_details: ProductDetails;
  quantity: number;
  unit_price: string;
  note?: string;
  customizations: OrderItemCustomization[];
  total_price: string;
}

interface VendorDetails {
  id: number;
  business_name: string;
  canteen: {
    id: number;
    name: string;
    location: string;
  };
}

interface Order {
  id: number;
  status: string;
  status_display: string;
  payment_status: string;
  payment_status_display: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  pickup_time?: string;
  note?: string;
  vendor: number;
  vendor_details: VendorDetails;
  items: OrderItem[];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'READY':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'PENDING_PAYMENT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(amount: string | number): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  return `₹${value.toFixed(2)}`;
}

export default async function OrdersPage() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const access = (session as any)?.access || (session as any)?.user?.access;
  
  if (!access) {
    console.error('No access token found in session');
    return redirect('/login');
  }

  let orders: Order[] = [];
  let error = null;

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    const res = await fetch(`${API_URL}/api/orders/`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch orders: ${res.status} ${errorText}`);
    }

    const data = await res.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      orders = data;
    } else if (data && Array.isArray(data.results)) {
      orders = data.results;
    } else if (data && Array.isArray(data.orders)) {
      orders = data.orders;
    } else {
      orders = [];
    }

  } catch (err) {
    console.error('Error fetching orders:', err);
    error = err instanceof Error ? err.message : 'Failed to load orders';
  }

  return (
    <>
      <section aria-label="Your orders" className="max-w-4xl mx-auto space-y-8 pt-16 p-4 md:p-6 mt-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Your Recent Orders
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Showing last 3 orders
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Failed to Load Orders
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {orders.length > 0 ? (
          <div className="space-y-8">
            {orders.map((order) => (
              <article key={order.id} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <header className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div>
                    <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      {order.vendor_details?.business_name || 'Unknown Vendor'}
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Order #{order.id} • Placed on {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Location: {order.vendor_details?.canteen?.name || 'Unknown Location'}
                    </div>
                  </div>
                </header>

                <ul className="divide-y divide-gray-200 dark:divide-gray-700 p-4" aria-live="polite">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      {item.product_details?.image_url && (
                        <img 
                          src={item.product_details.image_url} 
                          alt={item.product_details.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {item.product_details?.name || 'Unknown Product'}
                          {item.product_details?.is_veg && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">🟢 Veg</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.unit_price)} each
                        </div>
                        {item.note && (
                          <p className="text-xs italic text-gray-500 dark:text-gray-500 mt-1">
                            Note: {item.note}
                          </p>
                        )}
                        
                        {item.customizations?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Customizations:</p>
                            <div className="space-y-1">
                              {item.customizations.map((custom, index) => (
                                <div key={index} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                  <span>+ {custom.name_at_time}</span>
                                  <span>{formatCurrency(custom.price_at_time)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 ml-auto">
                        <div className="flex items-center">
                          <div className="w-16 text-center px-1 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white">
                            Qty: {item.quantity}
                          </div>
                        </div>

                        <div className="font-bold text-gray-800 dark:text-white w-20 text-right">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status_display}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Payment:</span>
                        <span className="text-gray-600 dark:text-gray-400">{order.payment_status_display}</span>
                      </div>
                      {order.pickup_time && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pickup:</span>
                          <span className="text-gray-600 dark:text-gray-400">{formatDate(order.pickup_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    {order.status === 'READY' && (
                      <button className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                        Mark as Collected
                      </button>
                    )}
                  </div>
                </footer>

                {order.note && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Order Note:</span> {order.note}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Orders Yet!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Looks like you haven't placed any orders yet. Start browsing delicious items!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-lg hover:scale-105 hover:shadow-emerald-600/30 transition-all shadow-md mt-4"
            >
              Browse Menu
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}