// src/app/cart/page.tsx
import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';
import CartClient from '@/components/CartClient';

export default async function CartPage() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const sess = session as unknown as { access?: string; user?: { access?: string } } | null;
  const access = sess?.access ?? sess?.user?.access ?? null;
  
  let carts = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/carts/`, {
      cache: 'no-store',
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        carts = data;
      } else if (data && Array.isArray(data.results)) {
        carts = data.results;
      } else if (data && Array.isArray(data.carts)) {
        carts = data.carts;
      } else if (data && typeof data === 'object') {
        carts = [data];
      }
      
      console.log('Server fetched carts:', carts);
    }
  } catch (error) {
    console.error('Server fetch error:', error);
    // Continue with empty carts - client will handle refetch
  }

  return (
    <main className="max-w-3xl mx-auto pt-16">
      <CartClient initialCarts={carts} />
    </main>
  );
}