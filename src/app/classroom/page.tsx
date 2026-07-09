import Link from "next/link";

export const metadata = {
  title: "Classroom",
  description:
    "Use Daily Globe Games as a free 5-minute daily geography warm-up for classrooms.",
};

export default function ClassroomPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-slate-300">
      <h1 className="mb-2 text-2xl font-semibold text-white">
        Daily Globe Games for Classrooms
      </h1>
      <p className="mb-6 text-slate-400">Free · No login required · 5 minutes</p>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Quick start</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Project the site on a screen (phone, tablet, or computer).</li>
          <li>
            Start with{" "}
            <Link href="/tap" className="text-sky-400 hover:underline">
              Tap
            </Link>{" "}
            for a clue-based warm-up, or{" "}
            <Link href="/" className="text-sky-400 hover:underline">
              Sweep
            </Link>{" "}
            for border geography.
          </li>
          <li>Students play individually on their devices, or vote as a class.</li>
          <li>Share spoiler-free score cards — no answers leaked.</li>
        </ol>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Why teachers use it</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>One new puzzle per day — no prep required.</li>
          <li>Three difficulty styles: borders, landmarks, and hidden countries.</li>
          <li>Works on any browser; no app install needed.</li>
          <li>Encourages daily habit and friendly competition.</li>
        </ul>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Suggested routine</h2>
        <p>
          <strong className="text-slate-200">Monday–Friday (5 min):</strong> Tap or
          Hunt as a bell-ringer. Offer Sweep as a bonus for fast finishers. Track
          class streaks on a whiteboard.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Accounts (optional)</h2>
        <p>
          Students can play without signing in. Accounts add friends,
          leaderboards, and cross-device streaks — useful for semester-long
          challenges.
        </p>
      </section>

      <p className="text-slate-500">
        Questions?{" "}
        <a href="mailto:hello@dailyglobegames.com" className="text-sky-400">
          hello@dailyglobegames.com
        </a>
      </p>
    </main>
  );
}
