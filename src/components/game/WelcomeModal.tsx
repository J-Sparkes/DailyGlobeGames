"use client";

import { useEffect, useRef } from "react";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { primeAudio } from "@/lib/sounds";

interface WelcomeModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    step: "1",
    title: "Name the highlight",
    body: "Every day starts with one random country glowing on the globe. Type its name to begin your sweep.",
  },
  {
    step: "2",
    title: "Grow your territory",
    body: "After a correct guess, that country's border appears. Click any unclaimed country that touches your sweep, then name it.",
  },
  {
    step: "3",
    title: "Explore the globe",
    body: "Drag or swipe to spin and pinch to zoom — there are no labels, so use geography and satellite clues.",
  },
  {
    step: "4",
    title: "Build your streak",
    body: "One wrong answer ends the run. How far across the map can you go in a single chain?",
  },
] as const;

export function WelcomeModal({ onClose }: WelcomeModalProps) {
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
      className="welcome-backdrop pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="welcome-panel relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f14] shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />

        <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8">
          <p className="text-xs font-semibold tracking-[0.28em] text-sky-400/90 uppercase">
            How to play
          </p>
          <h2
            id="welcome-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Sweep the world, one border at a time
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            A daily geography chain game. Everyone gets the same starting
            country — how long can your streak run?
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
              : "One sweep per day. When your run ends, share your streak with friends."}
          </p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              primeAudio();
              onClose();
            }}
            className="touch-target mt-6 w-full min-h-11 rounded-xl btn-primary px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ui-accent-primary)_60%,transparent)] focus:ring-offset-2 focus:ring-offset-[#0b0f14]"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}
