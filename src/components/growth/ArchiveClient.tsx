"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getArchiveDateOptions } from "@/lib/archive-play";
import { getModeDeepLink } from "@/lib/share-deep-link";
import { useAuth } from "@/contexts/AuthContext";

function ArchiveContent() {
  const params = useSearchParams();
  const upgraded = params.get("upgraded") === "1";
  const { user, configured } = useAuth();
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const dates = getArchiveDateOptions(90);

  useEffect(() => {
    trackEvent("premium_view");
  }, []);

  useEffect(() => {
    if (!user) {
      setPremium(false);
      setLoading(false);
      return;
    }
    void fetch("/api/subscription/status")
      .then((res) => (res.ok ? res.json() : { premium: false }))
      .then((data: { premium: boolean }) => {
        setPremium(Boolean(data.premium));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, upgraded]);

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        trackEvent("premium_convert", { stage: "checkout_redirect" });
        window.location.href = data.url;
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading archive…</p>;
  }

  if (!premium) {
    return (
      <div className="space-y-4">
        {upgraded && (
          <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sky-100">
            Thanks for subscribing! Premium may take a minute to activate after
            payment.
          </p>
        )}
        <h1 className="text-2xl font-semibold text-white">Puzzle Archive</h1>
        <p className="text-slate-400">
          Replay past daily puzzles for practice. Archive runs don&apos;t affect
          leaderboards.
        </p>
        {!configured || !user ? (
          <p className="text-sm text-slate-300">
            Sign in from the game menu to subscribe and unlock the archive.
          </p>
        ) : (
          <button
            type="button"
            disabled={checkoutLoading}
            onClick={() => void startCheckout()}
            className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {checkoutLoading ? "Loading…" : "Subscribe — unlock archive"}
          </button>
        )}
        <p className="text-xs text-slate-500">
          Today&apos;s three dailies stay free forever.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Puzzle Archive</h1>
      <p className="text-slate-400">
        Pick a past date. Practice runs don&apos;t count on leaderboards.
      </p>
      <ul className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {dates.map((date) => (
          <li
            key={date}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-white">{date}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Link href={getModeDeepLink("sweep", date)} className="text-sky-400">
                Sweep
              </Link>
              <Link href={getModeDeepLink("tap", date)} className="text-sky-400">
                Tap
              </Link>
              <Link href={getModeDeepLink("hunt", date)} className="text-sky-400">
                Hunt
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArchiveClient() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
      <ArchiveContent />
    </Suspense>
  );
}
