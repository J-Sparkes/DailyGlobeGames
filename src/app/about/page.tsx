import Link from "next/link";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyglobegames.com";

export const metadata = {
  title: "About",
  description:
    "Daily Globe Games — three free daily geography games on a 3D globe. Sweep borders, Tap landmarks, Hunt hidden countries.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-slate-300">
      <h1 className="mb-2 text-2xl font-semibold text-white">Daily Globe Games</h1>
      <p className="mb-6 text-slate-400">
        Three free daily geography games on a 3D globe — like Wordle for maps.
      </p>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">The three modes</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/" className="text-sky-400 hover:underline">
              Sweep
            </Link>{" "}
            — Name countries and expand across borders from a daily start nation.
          </li>
          <li>
            <Link href="/tap" className="text-sky-400 hover:underline">
              Tap
            </Link>{" "}
            — Read a clue and tap the globe to guess the location.
          </li>
          <li>
            <Link href="/hunt" className="text-sky-400 hover:underline">
              Hunt
            </Link>{" "}
            — Find a hidden country using distance hints.
          </li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">One puzzle per day</h2>
        <p>
          Each mode resets at midnight UTC. Build a cross-mode day streak, complete
          the daily trifecta (all three modes), share spoiler-free score cards, and
          compare with friends.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">For teachers</h2>
        <p>
          Looking for a classroom warm-up? See our{" "}
          <Link href="/classroom" className="text-sky-400 hover:underline">
            classroom guide
          </Link>
          .
        </p>
      </section>

      <p className="text-slate-500">
        <Link href="/" className="text-sky-400 hover:underline">
          Play today&apos;s puzzles
        </Link>
      </p>
    </main>
  );
}
