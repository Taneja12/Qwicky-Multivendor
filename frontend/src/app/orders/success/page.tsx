'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent_id');
    const orderId = searchParams.get('order_id');

    if (!sessionId && !paymentIntentId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.post('/api/payments/verify/', {
          session_id: sessionId,
          payment_intent_id: paymentIntentId,
          order_id: orderId
        });
        
        if (response.data.success) {
          setOrderData(response.data.data);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          {orderData && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <p className="text-sm">Order #{orderData.order?.id} was created but payment failed.</p>
            </div>
          )}
          <button
            onClick={() => router.push('/cart')}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-emerald-500 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for your order. Your payment has been processed successfully.
        </p>
        {orderData && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Order #: <span className="font-semibold">{orderData.order?.id}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Amount: <span className="font-semibold">₹{orderData.order?.total_amount}</span>
            </p>
          </div>
        )}
        <div className="space-x-4">
          <button
            onClick={() => router.push('/orders')}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            View Your Orders
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}