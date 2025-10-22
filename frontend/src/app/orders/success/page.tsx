'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID found');
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load order:', err);
        setError(err.message || 'Failed to load order');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => router.push('/orders')} className="mt-4">
              View All Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Order Successful!</CardTitle>
          <CardDescription>Thank you for your order</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {order ? (
            <div className="space-y-4">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Total Amount:</strong> ₹{order.total_amount}</p>
              <p><strong>Status:</strong> {order.status}</p>
              {order.items?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Order Items:</h3>
                  <ul className="list-disc pl-5">
                    {order.items.map((item: any) => (
                      <li key={item.id}>
                        {item.product.name} x {item.quantity} - ₹{item.unit_price * item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6">
                <Button onClick={() => router.push('/orders')} className="mr-4">
                  View All Orders
                </Button>
                <Button onClick={() => router.push('/vendors')} variant="outline">
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <p>No order details available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );