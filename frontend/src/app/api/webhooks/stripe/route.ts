import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import api from '@/lib/api';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!webhookSecret || !signature) {
    return new Response('Webhook secret or signature missing', { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Forward webhook to Django backend
    await api.post('/api/webhooks/stripe/', {
      type: event.type,
      data: {
        object: event.data.object
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      }
    });

    return NextResponse.json({ result: 'ok' });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }
}