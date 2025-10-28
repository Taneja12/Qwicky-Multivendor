"use client";

import React, { useState, useEffect } from 'react'; // Remove useEffect
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useStripe } from '@/lib/stripe-client';
import { useSession } from 'next-auth/react';

// --- Type Definitions ---
type Product = {
  id: number;
  name: string;
  price: string;
  image_url?: string | null;
};

type CartItem = {
  id: number;
  product: Product;
  quantity: number;
  note?: string;
  total_price?: number; 
};

type Canteen = {
  id: number;
  name: string;
};

type Cart = {
  id: number;
  canteen: number | Canteen | null;
  items: CartItem[];
  total_price?: number;
  item_count?: number;
};

// --- Helper function for currency formatting ---
const formatCurrency = (amount: number | string | undefined): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  return `₹${value.toFixed(2)}`;
};

// --- CartItem Component ---
type CartItemProps = {
  item: CartItem;
  onUpdateQuantity: (itemId: number, qty: number) => Promise<void>;
  onRemoveItem: (itemId: number) => Promise<void>;
  isLoading: boolean; 
};

const CartItemDisplay: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemoveItem, isLoading }) => {
  const price = parseFloat(item.product.price);
  const itemTotalPrice = item.total_price ?? (price * item.quantity);
  const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());

  // Update local quantity when item quantity changes from outside
  useEffect(() => {
    setLocalQuantity(item.quantity.toString());
  }, [item.quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input for better UX when typing
    if (value === '') {
      setLocalQuantity('');
      return;
    }
    
    // Only allow numbers
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1) {
      setLocalQuantity(numValue.toString());
    }
  };

  const handleQuantityBlur = () => {
    if (localQuantity === '') {
      // If input is empty, revert to original quantity
      setLocalQuantity(item.quantity.toString());
      return;
    }

    const numValue = parseInt(localQuantity, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue !== item.quantity) {
      onUpdateQuantity(item.id, numValue);
    } else if (numValue !== item.quantity) {
      // If value is invalid, revert to original quantity
      setLocalQuantity(item.quantity.toString());
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur which will save the value
    }
  };

  return (
    <li key={item.id} className={`flex items-start gap-4 p-3 border-b border-gray-200 last:border-b-0 dark:border-gray-700 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      
      <div className="flex-1 min-w-0 ">
        <div className="font-semibold text-gray-800 dark:text-white truncate ">{item.product.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(price)} each</div>
        {item.note && <p className="text-xs italic text-gray-500 dark:text-gray-500 mt-1">Note: {item.note}</p>}
      </div>

      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localQuantity}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            onKeyDown={handleQuantityKeyDown}
            className="w-16 text-center px-1 py-1 text-sm border-none bg-white dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
            aria-label={`Quantity for ${item.product.name}`}
            disabled={isLoading}
          />
        </div>

        <div className="font-bold text-gray-800 dark:text-white w-20 text-right">
          {formatCurrency(itemTotalPrice)}
        </div>

        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Remove ${item.product.name} from cart`}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </li>
  );
};

// --- Main CartClient Component ---
export default function CartClient({ initialCarts }: { initialCarts?: Cart[] }) {
  const { data: session } = useSession();
  const { stripe, loading: stripeLoading } = useStripe();
  const [carts, setCarts] = useState<Cart[]>(initialCarts || []);
  const [itemActionLoading, setItemActionLoading] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [whitening, setWhitening] = useState(false);

  // Remove the useEffect that fetches carts on mount
  // Use the initialCarts prop directly through local state

  async function fetchCarts() {
    try {
      const res = await api.get('/api/cart/carts/');
      
      // Handle different response formats
      let cartsData: Cart[] = [];
      
      if (Array.isArray(res.data)) {
        cartsData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        cartsData = res.data.results;
      } else if (res.data && Array.isArray(res.data.carts)) {
        cartsData = res.data.carts;
      } else if (res.data && typeof res.data === 'object') {
        cartsData = [res.data];
      }
      
      console.log('Client refetched carts:', cartsData);
      setCarts(cartsData);
    } catch (error) {
      console.error("Failed to fetch carts:", error);
      toast.error('Failed to refresh cart data');
    }
  }

  async function updateQuantity(itemId: number, qty: number) {
    if (qty < 1 || itemActionLoading) return; 
    setItemActionLoading(itemId);

    try {
      await api.patch(`/api/cart/items/${itemId}/`, { quantity: qty });
      await fetchCarts(); // Refresh after update
      toast.success(`Quantity updated — ${qty}`);
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error('Failed to update quantity');
    } finally {
      setItemActionLoading(null);
    }
  }

  async function removeItem(itemId: number) {
    if (itemActionLoading) return;

    setItemActionLoading(itemId);
    try {
      await api.delete(`/api/cart/items/${itemId}/`);
      await fetchCarts(); // Refresh after removal
      toast.success('Item removed');
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error('Failed to remove item');
    } finally {
      setItemActionLoading(null);
    }
  }

  async function clearCart(cartId: number) {
    try {
      await api.post(`/api/cart/carts/${cartId}/clear/`);
      await fetchCarts(); // Refresh after clear
      toast.success('Cart cleared — All items removed');
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast.error('Failed to clear cart');
    }
  }

  async function handleCheckout(cart: Cart) {
    if (!stripe || !session) {
      toast.error('Unable to process payment at this time');
      return;
    }

    setCheckoutLoading(cart.id);
    setWhitening(true);

    try {
      const response = await api.post('/api/payments/checkout/', { 
        cartId: cart.id,
      });

      const { url } = response.data;

      await new Promise(resolve => setTimeout(resolve, 500));

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize checkout. Please try again.');
      setWhitening(false);
    } finally {
      setCheckoutLoading(null);
    }
  }

  // Use the local state carts directly
  const displayCarts = carts;

  // Check if all carts are empty
  const allCartsEmpty = displayCarts.length === 0 || 
    displayCarts.every(cart => 
      cart && Array.isArray(cart.items) && cart.items.length === 0
    );

  // Remove the loading state since data comes from server
  if (allCartsEmpty) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your Cart is Empty!</h1>
        <p className="text-gray-600 dark:text-gray-400">Looks like you haven&apos;t added anything yet. Start browsing delicious items!</p>
      </div>
    );
  }

  return (
    <>
      {/* Whitening Overlay */}
      {whitening && (
        <div className="fixed inset-0 bg-white z-50 transition-all duration-500 ease-in-out flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Redirecting to Checkout...</h2>
            <p className="text-gray-600">Please wait while we prepare your payment</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setDrawerOpen(true)} aria-label="Open cart" className="bg-emerald-600 text-white px-3 py-2 rounded-full shadow-lg">Cart</button>
      </div>

      {/* Main cart listing */}
      <section aria-label="Shopping cart" className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-4">Your Shopping Cart(s)</h1>

        <div className="space-y-8">
          {displayCarts.map((cart) => cart && Array.isArray(cart.items) && cart.items.length > 0 && (
            <article key={cart.id} className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <header className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div>
                  <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {typeof cart.canteen === 'object' && cart.canteen ? 
                      (cart.canteen as Canteen).name : 
                      `Canteen ${cart.canteen ?? 'Unknown'}`
                    }
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Items: <span className="font-medium">{cart.item_count ?? (Array.isArray(cart.items) ? cart.items.length : 0)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(cart.total_price)}</div>
                  <button 
                    aria-label={`Clear all items from cart ${cart.id}`} 
                    onClick={() => clearCart(cart.id)} 
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1 transition-colors"
                  >
                    Remove All Items
                  </button>
                </div>
              </header>

              <ul className="divide-y divide-gray-200 dark:divide-gray-700 p-4" aria-live="polite">
                {Array.isArray(cart.items) && cart.items.map((it) => (
                  <CartItemDisplay 
                    key={it.id} 
                    item={it} 
                    onUpdateQuantity={updateQuantity} 
                    onRemoveItem={removeItem} 
                    isLoading={itemActionLoading === it.id} 
                  />
                ))}
              </ul>

              <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="text-gray-600 dark:text-gray-400">
                  {!stripeLoading ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Secure checkout with Stripe
                    </div>
                  ) : null}
                </div>
                <button 
                  className={`inline-flex justify-center items-center px-6 py-2 rounded-lg text-white font-medium shadow-md focus:outline-none focus:ring-4 transition-all ${
                    checkoutLoading === cart.id
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 hover:shadow-emerald-600/30 focus:ring-emerald-500/30'
                  }`}
                  onClick={() => handleCheckout(cart)}
                  disabled={checkoutLoading === cart.id || !stripe || whitening}
                >
                  {checkoutLoading === cart.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0b0b0b] text-white transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-50`} role="dialog" aria-label="Cart drawer">
        <div className="p-4 flex items-center justify-between border-b border-white/6">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="text-gray-300 hover:text-white">Close</button>
          </div>
        </div>
        <div className="p-4 overflow-auto h-full">
          {displayCarts.length === 0 ? (
            <p className="text-gray-400">Your cart is empty.</p>
          ) : (
            displayCarts.map(cart => (
              <div key={cart.id} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {typeof cart.canteen === 'object' ? 
                      (cart.canteen as Canteen).name : 
                      `Canteen ${cart.canteen}`
                    }
                  </div>
                  <div className="text-sm">{formatCurrency(cart.total_price)}</div>
                </div>
                <ul className="space-y-2">
                  {Array.isArray(cart.items) && cart.items.map(it => (
                    <li key={it.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.product.name}</div>
                        <div className="text-sm text-gray-400">{formatCurrency(it.product.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min={1} 
                          value={it.quantity} 
                          onChange={(e) => updateQuantity(it.id, Math.max(1, Number(e.target.value)))} 
                          className="w-16 rounded px-2 py-1 text-black" 
                        />
                        <button onClick={() => removeItem(it.id)} className="text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Items: {cart.item_count ?? (Array.isArray(cart.items) ? cart.items.length : 0)}
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(cart.total_price)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}