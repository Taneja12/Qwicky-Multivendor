'use client';

import { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      // Don't pass undefined into loadStripe — create a rejected promise with helpful message
      stripePromise = Promise.reject(new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Set it in frontend/.env.local for test mode (pk_test_...).'));
      return stripePromise;
    }
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
};

export function useStripe() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStripe()
      .then((stripe) => {
        setStripe(stripe);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Stripe:', err);
        setError('Failed to load payment system');
        setLoading(false);
      });
  }, []);

  return { stripe, loading, error };
}