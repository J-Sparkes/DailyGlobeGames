-- Daily Globe Games initial schema
-- Run in Supabase SQL editor or via supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists profiles_username_idx on public.profiles (username);

-- Daily results (one per user per mode per UTC date)
create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('sweep', 'tap', 'hunt')),
  date date not null,
  score integer not null check (score >= 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, mode, date)
);

create index if not exists daily_results_mode_date_score_idx
  on public.daily_results (mode, date, score desc);

create index if not exists daily_results_user_id_idx
  on public.daily_results (user_id);

-- Friendships (user follows friend)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_id_idx on public.friendships (user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.daily_results enable row level security;
alter table public.friendships enable row level security;

-- Profiles: public read, own write
create policy "profiles_public_read" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Daily results: public read for leaderboards, own insert
create policy "daily_results_public_read" on public.daily_results
  for select using (true);

create policy "daily_results_insert_own" on public.daily_results
  for insert with check (auth.uid() = user_id);

-- Friendships: read own, insert/delete own
create policy "friendships_read_own" on public.friendships
  for select using (auth.uid() = user_id);

create policy "friendships_insert_own" on public.friendships
  for insert with check (auth.uid() = user_id);

create policy "friendships_delete_own" on public.friendships
  for delete using (auth.uid() = user_id);

-- Leaderboard helper view (best score per user per mode)
create or replace view public.leaderboard_best as
select distinct on (user_id, mode)
  user_id,
  mode,
  score,
  date as achieved_date
from public.daily_results
order by user_id, mode, score desc, date desc;
