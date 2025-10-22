import Stripe from 'stripe';
import { Cart } from '@/types';

// Server-side requires the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in server environment');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-09-30.clover', // match installed stripe typings/runtime
});

export const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

// Prepare line items from cart for Stripe checkout
export const createStripeLineItems = (cart: Cart) => {
  const items = cart.items || [];
  return items.map((item) => ({
    price_data: {
      currency: 'inr',
      unit_amount: Math.round(parseFloat(item.product.price) * 100), // Convert to paise
      product_data: {
        name: item.product.name,
        description: `From ${cart.canteen && typeof cart.canteen === 'object' ? cart.canteen.name : `Canteen ${cart.canteen ?? ''}`}`,
        images: item.product.image_url ? [item.product.image_url] : [],
      },
    },
    quantity: item.quantity,
  }));
};

// Create Stripe Checkout session for a cart
export const createStripeCheckoutSession = async ({
  cart,
  successUrl,
  cancelUrl,
}: {
  cart: Cart;
  successUrl: string;
  cancelUrl: string;
}) => {
  const stripe = getStripeInstance();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: createStripeLineItems(cart),
    mode: 'payment',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      cartId: cart.id.toString(),
      canteenId: cart.canteen && typeof cart.canteen === 'object' ? cart.canteen.id.toString() : (cart.canteen ? cart.canteen.toString() : ''),
    },
  });

  return session;
};