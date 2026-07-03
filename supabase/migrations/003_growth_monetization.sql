-- Growth & monetization: premium, referrals

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists premium_until timestamptz,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists referral_count integer not null default 0,
  add column if not exists supporter_badge boolean not null default false;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
