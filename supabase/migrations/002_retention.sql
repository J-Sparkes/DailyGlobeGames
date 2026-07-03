-- Retention: calendar streak, email reminders, streak freeze

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_played_date date,
  add column if not exists streak_freeze_month text,
  add column if not exists email_reminders boolean not null default false,
  add column if not exists email_timezone text default 'UTC';
