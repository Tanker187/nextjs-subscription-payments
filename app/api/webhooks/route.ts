import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange,
  deleteProductRecord,
  deletePriceRecord
} from '@/utils/supabase/admin';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Webhook configuration is incomplete.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`Stripe webhook received: ${event.type}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    console.error(`Stripe webhook verification failed: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Stripe can send many event types to the same endpoint. A valid but
  // unhandled event should still receive 2xx so Stripe does not retry it.
  if (!relevantEvents.has(event.type)) {
    return Response.json({ received: true, handled: false });
  }

  try {
    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await upsertProductRecord(event.data.object as Stripe.Product);
        break;
      case 'product.deleted':
        await deleteProductRecord(event.data.object as Stripe.Product);
        break;
      case 'price.created':
      case 'price.updated':
        await upsertPriceRecord(event.data.object as Stripe.Price);
        break;
      case 'price.deleted':
        await deletePriceRecord(event.data.object as Stripe.Price);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await manageSubscriptionStatusChange(
          subscription.id,
          subscription.customer as string,
          event.type === 'customer.subscription.created'
        );
        break;
      }
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
          await manageSubscriptionStatusChange(
            checkoutSession.subscription as string,
            checkoutSession.customer as string,
            true
          );
        }
        break;
      }
    }
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    return new Response(
      'Webhook handler failed. View the Vercel function logs for details.',
      { status: 500 }
    );
  }

  return Response.json({ received: true, handled: true });
}
