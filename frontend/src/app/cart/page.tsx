// src/app/cart/page.tsx
import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';
import CartClient from '@/components/CartClient';

// src/app/cart/page.tsx
export default async function CartPage() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const sess = session as unknown as { access?: string; user?: { access?: string } } | null;
  const access = sess?.access ?? sess?.user?.access ?? null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/carts/`, {
    cache: 'no-store',
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  });
  
  let carts = [];
  if (res.ok) {
    carts = await res.json();
    console.log('Server fetched carts:', carts); // Add this log
  }

  return (
    <main className="max-w-3xl mx-auto pt-16">
      <CartClient initialCarts={carts} />
    </main>
  );
}