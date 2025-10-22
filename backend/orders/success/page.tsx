'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Invalid session');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.post('/api/payments/verify/', {
          session_id: sessionId
        });
        
        if (response.data.success) {
          setOrderData(response.data);
          setLoading(false);
        } else {
          setError(response.data.error || 'Payment verification failed');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setError(error.response?.data?.error || 'Failed to verify payment');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          {orderData && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <p className="text-sm">Order #{orderData.orderId} was created but payment failed.</p>
            </div>
          )}
          <div className="space-x-4">
            <Link
              href="/cart"
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Return to Cart
            </Link>
            <Link
              href="/"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-4">
        <div className="text-emerald-500 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for your order. Your payment has been processed successfully.
        </p>
        {orderData && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Details</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Order Number:</span>
                <span className="font-semibold">#{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-semibold">{orderData.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-emerald-600">{orderData.payment_status}</span>
              </div>
            </div>
          </div>
        )}
        <div className="space-x-4">
          <Link
            href="/orders"
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            View Your Orders
          </Link>
          <Link
            href="/"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}