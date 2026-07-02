export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-slate-300">
      <h1 className="mb-6 text-2xl font-semibold text-white">Privacy Policy</h1>
      <p className="mb-4 text-slate-400">Last updated: June 30, 2026</p>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">What we collect</h2>
        <p>
          Daily Geography stores game progress locally in your browser. If you
          create an account, we store your email (via Supabase Auth), display
          name, username, daily scores, and friends list in our database.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">How we use data</h2>
        <p>
          Account data powers leaderboards, friends comparisons, and cross-device
          sync. We do not sell your personal information.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">Third parties</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase — authentication and database hosting</li>
          <li>Vercel — website hosting</li>
        </ul>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">Your rights</h2>
        <p>
          You can delete your account from the in-game menu, which removes your
          profile and scores from our servers. Clear browser storage to remove
          local-only data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Contact</h2>
        <p>
          Questions:{" "}
          <a href="mailto:hello@dailygeography.app" className="text-sky-400">
            hello@dailygeography.app
          </a>
        </p>
      </section>
    </main>
  );
}
