import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function recordStripeCheckoutPayment({
  checkoutSessionId,
  paymentIntentId,
  customerId,
  amount,
  currency
}: {
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerId: string;
  amount: number;
  currency: string;
}) {
  const { data: customer, error: customerError } = await (supabaseAdmin as any)
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (customerError) {
    throw new Error(`Stripe customer lookup failed: ${customerError.message}`);
  }

  const { data, error } = await (supabaseAdmin as any).rpc(
    'record_stripe_checkout_payment',
    {
      p_user_id: customer.id,
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
