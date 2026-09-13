-- Wallet ledger for one-time Stripe payments.
create table if not exists public.wallets (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance bigint not null default 0 check (balance >= 0),
  currency text not null default 'usd' check (char_length(currency) = 3),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.wallets enable row level security;

create policy "Users can view their own wallet"
on public.wallets for select
using (auth.uid() = user_id);

create table if not exists public.payment_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete restrict not null,
  wallet_user_id uuid references public.wallets(user_id) on delete restrict not null,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount bigint not null check (amount > 0),
  currency text not null check (char_length(currency) = 3),
  status text not null default 'paid' check (status in ('paid', 'refunded', 'failed')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists payment_ledger_user_id_idx on public.payment_ledger(user_id);
create index if not exists payment_ledger_payment_intent_idx on public.payment_ledger(stripe_payment_intent_id);

alter table public.payment_ledger enable row level security;

create policy "Users can view their own payments"
on public.payment_ledger for select
using (auth.uid() = user_id);

-- Webhooks run with the Supabase service role. This function makes the ledger
-- insert and wallet credit atomic and idempotent for a Stripe Checkout session.
create or replace function public.record_stripe_checkout_payment(
  p_user_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_amount bigint,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Stripe payment amount must be positive';
  end if;

  insert into public.wallets (user_id, currency)
  values (p_user_id, lower(p_currency))
  on conflict (user_id) do nothing;

  insert into public.payment_ledger (
    user_id,
    wallet_user_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_customer_id,
    amount,
    currency,
    status
  ) values (
    p_user_id,
    p_user_id,
    p_checkout_session_id,
    p_payment_intent_id,
    p_customer_id,
    p_amount,
    lower(p_currency),
    'paid'
  )
  on conflict (stripe_checkout_session_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.wallets
    set balance = balance + p_amount,
        updated_at = timezone('utc'::text, now())
    where user_id = p_user_id;
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.record_stripe_checkout_payment(uuid, text, text, text, bigint, text) from public;
revoke all on function public.record_stripe_checkout_payment(uuid, text, text, text, bigint, text) from anon;
revoke all on function public.record_stripe_checkout_payment(uuid, text, text, text, bigint, text) from authenticated;
grant execute on function public.record_stripe_checkout_payment(uuid, text, text, text, bigint, text) to service_role;
