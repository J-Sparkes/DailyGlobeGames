"use client";

import { useEffect, useRef } from "react";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { primeAudio } from "@/lib/sounds";

interface HuntWelcomeModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    step: "1",
    title: "A hidden country",
    body: "Every day, one country is chosen in secret. The map shows no borders — only satellite imagery.",
  },
  {
    step: "2",
    title: "Tap to measure",
    body: "Click any country on the globe. You'll see how many miles away it is from today's hidden country.",
  },
  {
    step: "3",
    title: "Hot and cold",
    body: "Each guess tells you if you're warmer or colder than your last try. Use the distances to triangulate.",
  },
  {
    step: "4",
    title: "Three chances",
    body: "You get three guesses. Click the hidden country to win — the sooner you find it, the higher your score.",
  },
] as const;

export function HuntWelcomeModal({ onClose }: HuntWelcomeModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const unlimited = isUnlimitedPlaysEnabled();

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="welcome-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hunt-welcome-title"
        className="welcome-panel relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f14] shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />

        <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
          <p className="text-xs font-semibold tracking-[0.28em] text-sky-400/90 uppercase">
            How to play
          </p>
          <h2
            id="hunt-welcome-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Find the hidden country
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            A daily hot-and-cold hunt on the globe. Three guesses, one mystery
            nation — how fast can you find it?
          </p>

          <ol className="mt-6 space-y-3">
            {STEPS.map((item) => (
              <li
                key={item.step}
                className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-300 ring-1 ring-sky-500/25">
                  {item.step}
                </span>
                <div>
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-5 rounded-lg border border-white/[0.06] bg-black/30 px-4 py-3 text-xs leading-relaxed text-slate-500">
            {unlimited
              ? "Test mode is on — you can replay as many times as you like."
              : "One hunt per day. Win on guess 1 for 3 points, guess 2 for 2, guess 3 for 1."}
          </p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              primeAudio();
              onClose();
            }}
            className="touch-target mt-6 w-full min-h-11 rounded-xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 focus:ring-offset-[#0b0f14]"
          >
            Start hunting
          </button>
        </div>
      </div>
    </div>
  );
}
