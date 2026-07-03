# Launch playbook — Daily Globe Games

Use this when posting to Product Hunt, Reddit, X, and geography communities.

## One-line pitch

**Three free daily geography games on a 3D globe — like Wordle for maps.**

## Mode descriptions

| Mode | URL | Hook |
|------|-----|------|
| Sweep | `/` | Name countries and expand across borders |
| Tap | `/tap` | Read a clue, tap the globe |
| Hunt | `/hunt` | Find a hidden country in 3 guesses |

## Share assets

- **Score card image:** `/api/share/card?mode=sweep&date=YYYY-MM-DD&score=12`
- **Deep links:** `/?d=YYYY-MM-DD`, `/tap?d=...`, `/hunt?d=...`
- **Friend compare:** `/compare?user=USERNAME&date=YYYY-MM-DD&mode=sweep`
- **Referral:** `/?ref=USERNAME`

Share copy includes challenge lines like *"I swept 12 countries today — can you beat me?"*

## Product Hunt checklist

1. Title: **Daily Globe Games**
2. Tagline: *Three daily geography puzzles on a 3D globe*
3. Gallery: screenshot of each mode + share card image
4. First comment: explain Sweep / Tap / Hunt + link to `/about`
5. Launch Tuesday–Thursday, respond to every comment

## Reddit posts (adapt per sub rules)

**r/geography, r/geoguessr, r/puzzles**

> I built a free daily geography game with three modes on a 3D globe:
> - **Sweep** — border expansion puzzle
> - **Tap** — clue + tap the map
> - **Hunt** — Wordle-style hidden country
>
> One puzzle per mode per day. No login required. Would love feedback!
>
> [your-domain.com]

**r/Teachers**

> Free 5-minute daily geography warm-up for classrooms — three modes, no login.
> Classroom guide: [your-domain.com/classroom]

## X / Twitter thread

1. Hook + screenshot of globe
2. Explain trifecta (all 3 modes in one day)
3. Post your share card image with score
4. Link to today's Sweep with deep link

## Hacker News (Show HN)

Angle: deterministic server-side dailies, open geographic data, three game modes on one engine.

## After launch

- Monitor Plausible for `daily_complete`, `share_clicked`, `return_within_24h`
- Enable daily email cron (`vercel.json` + Resend)
- Set `NEXT_PUBLIC_SUPPORT_URL` for tip jar in game menu
