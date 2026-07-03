export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-slate-300">
      <h1 className="mb-6 text-2xl font-semibold text-white">Terms of Service</h1>
      <p className="mb-4 text-slate-400">Last updated: June 30, 2026</p>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">Using Daily Globe Games</h2>
        <p>
          Daily Globe Games is a free daily puzzle game. One official play per mode
          per UTC day unless test mode is enabled by the operator.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">Accounts and conduct</h2>
        <p>
          Usernames must not be offensive or impersonate others. Attempts to cheat
          leaderboards (automated play, score manipulation, or exploiting bugs)
          may result in score removal or account suspension.
        </p>
      </section>

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-medium text-white">Disclaimer</h2>
        <p>
          The game is provided as-is without warranties. Map data and borders are
          approximate and for entertainment purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Changes</h2>
        <p>
          We may update these terms. Continued use after changes constitutes
          acceptance.
        </p>
      </section>
    </main>
  );
}
