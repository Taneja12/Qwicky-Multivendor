import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';
import CartWrapper from '@/components/CartWrapper';

export default async function CartPage() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const sess = session as unknown as { access?: string; user?: { access?: string } } | null;
  const access = sess?.access ?? sess?.user?.access ?? null;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/carts/`, {
    cache: 'no-store',
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  });
  const carts = res.ok ? await res.json() : [];

  return (
    <main>
      <CartWrapper initialCarts={carts} />
    </main>
  );
}