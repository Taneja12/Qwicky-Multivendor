"use client";

import dynamic from 'next/dynamic';

const CartClient = dynamic(() => import('@/components/CartClient'), { 
  ssr: false,
  loading: () => <div className="p-4">Loading cart...</div>
});

export default function CartWrapper({ initialCarts }: { initialCarts?: any[] }) {
  return <CartClient initialCarts={initialCarts} />;
}