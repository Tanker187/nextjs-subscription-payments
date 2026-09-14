import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is required for server-side Stripe operations.');
}

export const stripe = new Stripe(secretKey, {
  appInfo: {
    name: 'Next.js Subscription Starter',
    version: '0.0.0',
    url: 'https://github.com/vercel/nextjs-subscription-payments'
  }
});
