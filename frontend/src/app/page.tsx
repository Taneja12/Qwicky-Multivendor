// app/page.tsx
import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'Order Food from Campus Canteens',
  description:
    'Preorder food from campus canteens, skip queues, and enjoy fresh meals on campus.',

  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },

  openGraph: {
    title: 'Order Food from Campus Canteens | Qwicky',
    description:
      'Preorder food from campus canteens, skip queues, and enjoy fresh meals on campus.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Qwicky campus food ordering',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    images: ['/og-default.jpg'],
  },
};

export default function Page() {
  return <HomePageClient />;
}
