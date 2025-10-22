import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { orderId } = await req.json();
    
    // Create checkout session through Django backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(session as any).access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}