"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Product = {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  image?: any;
  image_url?: string | null;
  is_available?: boolean;
  is_veg?: boolean;
  vendor: number | {
    id: number;
    business_name: string;
    canteen?: {
      id: number;
      name: string;
      location?: string;
    } | null;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  preparation_time?: number;
  customization_options?: CustomizationOption[];
};

type CustomizationOption = {
  id: number;
  name: string;
  price_addition: number | string;
  is_available: boolean;
};

type Vendor = {
  id: number;
  business_name: string;
  description?: string;
  is_open?: boolean;
  avg_preparation_time?: number;
  canteen?: {
    id: number;
    name: string;
    location?: string;
  } | null;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/products/${productId}/`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const productData = await response.json();
      setProduct(productData);

      // Fetch vendor details
      const vendorId = typeof productData.vendor === 'object' 
        ? productData.vendor.id 
        : productData.vendor;
      
      await fetchVendorDetails(vendorId);

    } catch (err) {
      setError('Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetails = async (vendorId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/vendors/vendors/${vendorId}/`);
      if (response.ok) {
        const vendorData = await response.json();
        setVendor(vendorData);
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
    }
  };

  const getProductImageUrl = () => {
    if (!product) return '/images/product-placeholder.jpg';

    if (typeof product.image_url === 'string') {
      return product.image_url;
    }
    
    if (product.image && typeof product.image === 'object' && product.image.url) {
      return product.image.url;
    }
    
    if (product.image && typeof product.image === 'object' && product.image.secure_url) {
      return product.image.secure_url;
    }
    
    if (typeof product.image === 'string') {
      return product.image;
    }
    
    return '/images/product-placeholder.jpg';
  };

  const handleAddToCart = async () => {
    if (!session) {
      toast.error('Please sign in to add items to cart');
      router.push('/login');
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    
    try {
      const vendorId = typeof product.vendor === 'object' 
        ? product.vendor.id 
        : product.vendor;

      // Ensure cart exists for this canteen
      const cartRes = await fetch(`${API_BASE}/api/cart/carts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access}`
        },
        body: JSON.stringify({ canteen: vendor?.canteen?.id })
      });

      if (!cartRes.ok) throw new Error('Failed to create cart');
      
      const cartData = await cartRes.json();
      const cartId = cartData.id;

      // Prepare item data
      const itemData: any = {
        cart: cartId,
        product_id: product.id,
        quantity: quantity
      };

      // Add customizations if any selected
      if (selectedCustomizations.length > 0) {
        itemData.customizations = selectedCustomizations;
      }

      // Add note if provided
      if (note.trim()) {
        itemData.note = note.trim();
      }

      // Add item to cart
      const itemRes = await fetch(`${API_BASE}/api/cart/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access}`
        },
        body: JSON.stringify(itemData)
      });
      
      if (!itemRes.ok) throw new Error('Failed to add item');
      
      toast.success(`${product.name} added to cart — ${quantity}`);

    } catch (err: unknown) {
      console.error(err);
      
      // Check if it's an authentication error
      if (err instanceof Error && err.message.includes('401')) {
        toast.error('Please sign in to add items to cart');
        router.push('/login');
        return;
      }
      
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleCustomization = (optionId: number) => {
    setSelectedCustomizations(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    
    const basePrice = typeof product.price === 'string' 
      ? parseFloat(product.price) 
      : product.price;

    const customizationPrice = selectedCustomizations.reduce((total, optionId) => {
      const option = product.customization_options?.find(opt => opt.id === optionId);
      if (option) {
        const optionPrice = typeof option.price_addition === 'string'
          ? parseFloat(option.price_addition)
          : option.price_addition;
        return total + optionPrice;
      }
      return total;
    }, 0);

    return (basePrice + customizationPrice) * quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-300 dark:bg-gray-700 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Product Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || 'The product you are looking for does not exist.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const productImage = getProductImageUrl();
  const vendorName = typeof product.vendor === 'object' 
    ? product.vendor.business_name 
    : 'Vendor';
  const isVeg = product.is_veg ? '🟢 Veg' : '🔴 Non-Veg';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <button 
            onClick={() => router.push('/')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Home
          </button>
          <span>›</span>
          <button 
            onClick={() => router.push(`/vendors/${typeof product.vendor === 'object' ? product.vendor.id : product.vendor}`)}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {vendorName}
          </button>
          <span>›</span>
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-96 w-full">
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
          </div>

          {/* Product Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className={product.is_available ? 'text-emerald-600' : 'text-red-600'}>
                    {product.is_available ? 'Available' : 'Out of Stock'}
                  </span>
                  <span>{isVeg}</span>
                  {product.preparation_time && (
                    <span>⏱️ {product.preparation_time} mins</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-emerald-600">
                ₹{getTotalPrice().toFixed(2)}
                {selectedCustomizations.length > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Base: ₹{typeof product.price === 'string' ? product.price : product.price.toFixed(2)})
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Vendor Info */}
              {vendor && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    From {vendor.business_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      vendor.is_open 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.is_open ? 'Open' : 'Closed'}
                    </span>
                    {vendor.canteen && (
                      <span>{vendor.canteen.name}</span>
                    )}
                    {vendor.avg_preparation_time && (
                      <span>Avg. {vendor.avg_preparation_time} mins</span>
                    )}
                  </div>
                </div>
              )}

              {/* Customization Options */}
              {product.customization_options && product.customization_options.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Customizations
                  </h3>
                  <div className="space-y-2">
                    {product.customization_options
                      .filter(option => option.is_available)
                      .map((option) => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCustomizations.includes(option.id)}
                            onChange={() => toggleCustomization(option.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-gray-900 dark:text-white flex-1">
                            {option.name}
                          </span>
                          <span className="text-emerald-600 font-medium">
                            +₹{typeof option.price_addition === 'string' ? option.price_addition : option.price_addition.toFixed(2)}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Quantity & Note */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any special requests or allergies..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.is_available || !session || addingToCart}
                className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {addingToCart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <span>
                    {!session ? 'Sign In to Order' : 
                     !product.is_available ? 'Out of Stock' : 
                     `Add to Cart - ₹${getTotalPrice().toFixed(2)}`}
                  </span>
                )}
              </button>

              {!session && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Please sign in to add items to your cart
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}