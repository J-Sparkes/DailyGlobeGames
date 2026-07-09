# Daily Globe Games — MVP Documentation

A human-readable plan for what the app is, what must ship, how data fits together, and how to build it in phases.

---

## Core Value Proposition

**Daily Globe Games** is a free daily geography puzzle site — like Wordle for maps — where everyone gets the same three challenges each UTC day on a 3D globe. Players can **Sweep** across country borders, **Tap** landmarks from clues, and **Hunt** a hidden country in three guesses, then share their scores with friends.

The hook is simple: one shared daily puzzle per mode, no install required, playable in the browser in under five minutes.

---

## MVP Feature Scope

Only what is required to **launch**, **retain players**, and **start earning**. Everything else is built in the repo but should wait until after launch.

### Must ship (launch blockers)

| Area | What it includes | Why it matters |
|------|------------------|----------------|
| **Three daily games** | Sweep (`/`), Tap (`/tap`), Hunt (`/hunt`) on a 3D globe | The product |
| **Server-backed dailies** | One puzzle per mode per UTC day; deterministic seeds; anti-cheat validation on submit | Fair, shared experience — everyone plays the same puzzle |
| **Guest play** | Full gameplay without an account; progress saved in the browser | Zero friction first visit |
| **One play per mode per day** | Enforced client-side (localStorage) and server-side for logged-in users | Creates daily habit |
| **Share results** | Text share lines + OG image card (`/api/share/card`) + deep links (`?d=YYYY-MM-DD`) | Organic growth — the main distribution loop |
| **Legal pages** | Privacy (`/privacy`) and Terms (`/terms`) | Required for public launch |
| **Deploy + domain** | Vercel + `dailyglobegames.com` + `NEXT_PUBLIC_SITE_URL` | People need a stable URL to share |

### Should ship (launch week — social layer)

| Area | What it includes | Why it matters |
|------|------------------|----------------|
| **Accounts** | Supabase magic-link auth; username + display name | Lets scores persist across devices |
| **Cloud scores** | Submit results to `daily_results` on game completion | Foundation for competition |
| **Global leaderboard** | Best score per mode, per day | Gives players a reason to come back and compare |
| **About page** | `/about` — what the games are and how to play | Converts curious visitors from shares |

### Minimum monetization (first revenue)

| Area | What it includes | When to turn on |
|------|------------------|-----------------|
| **Tip jar** | Link in game menu via `NEXT_PUBLIC_SUPPORT_URL` (Ko-fi, Buy Me a Coffee, etc.) | **Day 1** — zero backend, validates willingness to pay |
| **Archive + Premium** | Replay past puzzles behind Stripe subscription (`/archive`, checkout + webhook) | **After ~1k+ returning players** — needs enough demand to justify a paywall |

### Explicitly not MVP (ship later)

These exist in the codebase but are **nice-to-haves** — do not block launch:

- Calendar streaks, trifecta nudge, activity heatmap, streak freeze
- Email reminder cron (Resend + Vercel cron)
- Friend list, friend leaderboards, compare links, referral (`?ref=`)
- Plausible analytics and cohort events
- Classroom marketing page (`/classroom`)
- Supporter badge (schema exists; no UI yet)

---

## Database Schema & Data Flow

### Who stores what

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (guest or logged-in)                                   │
│  • Game progress & completion → localStorage                    │
│  • Optional local profile, friends, history (no account needed)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ on game submit (if logged in)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API routes (/api/daily/*, /api/profile, etc.)          │
│  • Validates guesses server-side (Sweep path, Hunt guesses)     │
│  • Upserts score into Supabase                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth)                                   │
│  • auth.users — identity (email magic link)                     │
│  • profiles — username, streaks, email prefs, premium status      │
│  • daily_results — one row per user × mode × UTC date           │
│  • friendships — who follows whom (one-way)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Database tables

**`profiles`** (one row per user, extends `auth.users`)

| Column | Purpose |
|--------|---------|
| `username`, `display_name` | Public identity on leaderboards |
| `current_streak`, `longest_streak`, `last_played_date` | Calendar streak (retention) |
| `streak_freeze_month` | One missed-day forgiveness per month |
| `email_reminders`, `email_timezone` | Daily email opt-in |
| `stripe_customer_id`, `premium_until` | Archive subscription |
| `referred_by`, `referral_count` | Referral loop |

**`daily_results`** (the core game record)

| Column | Purpose |
|--------|---------|
| `user_id` → `profiles` | Who played |
| `mode` | `sweep`, `tap`, or `hunt` |
| `date` | UTC puzzle date |
| `score` | Mode-specific score |
| `metadata` | Extra detail (path length, guess count, etc.) |

Unique constraint: **one result per user per mode per day**.

**`friendships`** (social graph)

| Column | Purpose |
|--------|---------|
| `user_id` → `profiles` | The follower |
| `friend_id` → `profiles` | Who they follow |

**`leaderboard_best`** (view) — best score per user per mode across all dates.

### Typical play session

1. Player opens the site → client fetches today's puzzle from `/api/daily/{mode}`.
2. Player plays → progress saved to **localStorage** (`geography-game-daily-v1`, etc.).
3. On completion → client calls `/api/daily/{mode}/submit`.
4. If **logged in** → server validates, writes to `daily_results`, updates streak on `profiles`.
5. If **guest** → score stays local only; share still works via text + OG card.
6. Player taps **Share** → share line + link with `?d=` date param for viral return visits.

### Migrations (run in order in Supabase SQL editor)

| File | Adds |
|------|------|
| `001_initial.sql` | `profiles`, `daily_results`, `friendships`, RLS policies, leaderboard view |
| `002_retention.sql` | Streak columns, email reminder prefs |
| `003_growth_monetization.sql` | Stripe/premium columns, referral columns |

For MVP launch with accounts + leaderboards, run **001** only. Add **002** and **003** when you enable retention features and monetization.

---

## Step-by-Step Implementation Roadmap

### Phase 1 — Playable product (done in code)

**Goal:** A stranger can play all three modes today without signing up.

- [x] 3D globe with Sweep, Tap, and Hunt game logic
- [x] Server-generated daily puzzles (deterministic per UTC date)
- [x] Client-side one-play-per-day enforcement
- [x] Share text + OG image card + date deep links
- [x] Privacy and Terms pages
- [x] Unit tests and CI (`npm test`, `npm run lint`, `npm run build`)

**Exit criteria:** `npm run dev` works locally; all three modes completable; share link copies correctly.

---

### Phase 2 — Go live

**Goal:** Public URL anyone can visit and share.

1. Push code to GitHub (`J-Sparkes/DailyGlobeGames`)
2. Import repo into **Vercel** → deploy
3. Set env var: `NEXT_PUBLIC_SITE_URL=https://dailyglobegames.com`
4. Point **GoDaddy DNS** at Vercel (A record `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`)
5. Smoke-test all three modes on production URL
6. Post first share to one community (Reddit, X, friends) with OG card

**Exit criteria:** `dailyglobegames.com` loads; share links use the real domain; legal pages accessible.

---

### Phase 3 — Accounts and leaderboards

**Goal:** Players can sign in, save scores, and see how they rank.

1. Create **Supabase** project
2. Run `001_initial.sql`
3. Enable Email magic link in Supabase Auth
4. Add redirect URL: `https://dailyglobegames.com/api/auth/callback`
5. Add to Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
6. Redeploy and test: sign up → play → score appears on leaderboard

**Exit criteria:** Logged-in user completes a mode; score persists after refresh; global leaderboard shows today's top scores.

---

### Phase 4 — First revenue

**Goal:** Validate that players will pay, without building billing complexity on day one.

1. Create a **Ko-fi** or **Buy Me a Coffee** page
2. Set `NEXT_PUBLIC_SUPPORT_URL` in Vercel
3. Redeploy — "Support" link appears in game menu
4. Mention supporter link in share posts and About page

**Exit criteria:** Tip link live; at least a few clicks/conversions to confirm demand.

---

### Phase 5 — Growth loop (after first 100+ daily players)

**Goal:** Make sharing and return visits measurable and self-reinforcing.

1. Add **Plausible** (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN=dailyglobegames.com`)
2. Run `002_retention.sql` — enable streaks in UI (already built)
3. Ship trifecta nudge ("You swept — Tap and Hunt are waiting")
4. Optional: friend compare links (`/compare`) and referral (`?ref=username`)
5. Optional: email reminders (Resend + `CRON_SECRET` + migration 002 columns)

**Exit criteria:** You can answer "how many people played today?" and "what % shared their score?"

---

### Phase 6 — Premium archive (after sustained DAU)

**Goal:** Recurring revenue from players who want more puzzles.

1. Run `003_growth_monetization.sql`
2. Create **Stripe** product + price (monthly subscription)
3. Set `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
4. Configure Stripe webhook → `https://dailyglobegames.com/api/stripe/webhook`
5. Test `/archive` — past dates gated for non-subscribers; playable for premium

**Exit criteria:** User can subscribe, replay a past date, and cancel without breaking today's free play.

---

### Phase 7 — Educator and community distribution (ongoing)

**Goal:** Weekday traffic from teachers and geography enthusiasts.

- Publish `/classroom` one-pager in teacher forums
- Launch on Product Hunt with OG share cards
- Post daily results threads in geography subreddits
- Iterate on puzzle difficulty based on completion rates

---

## Quick reference

| Item | Value |
|------|-------|
| **Repo** | [github.com/J-Sparkes/DailyGlobeGames](https://github.com/J-Sparkes/DailyGlobeGames) |
| **Domain** | `dailyglobegames.com` |
| **Stack** | Next.js 16, React 19, Supabase, Vercel |
| **Puzzle reset** | Midnight UTC daily |
| **Env template** | `.env.example` |
| **Launch playbook** | `docs/marketing/LAUNCH.md` |
