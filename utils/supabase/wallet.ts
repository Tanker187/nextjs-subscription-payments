import { createClient } from '@supabase/supabase-js';

// This module is server-side only. It uses the Supabase service role because
// Stripe webhooks have no end-user session.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function recordStripeCheckoutPayment({
  userId,
  checkoutSessionId,
  paymentIntentId,
  customerId,
  amount,
  currency
}: {
  userId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerId: string;
  amount: number;
  currency: string;
}) {
  const { data, error } = await (supabaseAdmin as any).rpc(
    'record_stripe_checkout_payment',
    {
      p_user_id: userId,
      p_checkout_session_id: checkoutSessionId,
      p_payment_intent_id: paymentIntentId,
      p_customer_id: customerId,
      p_amount: amount,
      p_currency: currency
    }
  );

  if (error) {
    throw new Error(`Wallet payment recording failed: ${error.message}`);
  }

  return data === true;
}
