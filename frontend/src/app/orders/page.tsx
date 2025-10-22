import { redirect } from 'next/navigation';
import { requireUserSession } from '@/lib/serverAuth';

export default async function OrdersPage() {
  const session = await requireUserSession();
  if (!session) return redirect('/login');

  const access = (session as any)?.access || (session as any)?.user?.access;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/`, {
    cache: 'no-store',
    headers: access ? { Authorization: `Bearer ${access}` } : undefined,
  });
  const orders = res.ok ? await res.json() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      {orders.length ? (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="border rounded p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Order #{o.id}</div>
                  <div className="text-sm text-gray-600">Status: {o.status_display}</div>
                </div>
                <div className="font-semibold">₹{o.total_amount}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">You have no orders yet.</p>
      )}
    </div>
  );
}