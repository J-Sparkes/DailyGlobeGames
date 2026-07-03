# Daily Globe Games

A daily geography game with three modes:

- **Sweep** (`/`) — Name countries and expand your sweep across neighboring borders.
- **Tap** (`/tap`) — Read a clue and tap the globe to guess the location.
- **Hunt** (`/hunt`) — Find a hidden country in three guesses using distance hints.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run validate-data` | Validate country/location JSON datasets |

### Environment variables

See [`.env.example`](.env.example). For local development, Supabase credentials are optional — the game falls back to device-local play without accounts.

**Production checklist:**

- Set `NEXT_PUBLIC_SITE_URL` to your domain
- Configure Supabase keys and run migrations in `supabase/migrations/`
- Do **not** set `NEXT_PUBLIC_UNLIMITED_PLAYS` in production
- Optional: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `RESEND_*` + `CRON_SECRET`, `NEXT_PUBLIC_SUPPORT_URL`, Stripe keys for archive premium
- See [docs/marketing/LAUNCH.md](docs/marketing/LAUNCH.md) for launch playbook

## Supabase setup

1. Create a Supabase project
2. Run `supabase/migrations/001_initial.sql` in the SQL editor
3. Enable Email (magic link) and/or Google auth in Supabase Auth settings
4. Add redirect URL: `https://your-domain.com/api/auth/callback`
5. Copy project URL and keys into `.env.local` / Vercel env vars

## Deploy on Vercel

1. Import the repository
2. Add environment variables from `.env.example`
3. Deploy — Next.js 16 App Router, no extra config required

## Data attribution

- Country borders: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON 110m)
- Globe texture: NASA Blue Marble / public satellite imagery (`public/earth-satellite.jpg`)
- Game country graph and Tap locations: curated project datasets in `src/data/`

## Project structure

```
src/
  app/           Next.js routes and API handlers
  components/    Game UI, globe, menu
  lib/           Game logic, server validation, Supabase clients
  data/          Country graph, locations, hunt tiers
supabase/
  migrations/    Database schema
public/          Static assets (TopoJSON, textures)
```
