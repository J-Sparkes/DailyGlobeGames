"use client";

import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import {
  WelcomeModalShell,
  type WelcomeStep,
} from "@/components/game/WelcomeModalShell";

interface HuntWelcomeModalProps {
  onClose: () => void;
}

const STEPS: WelcomeStep[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 7v4l2.5 2.5" />
      </svg>
    ),
    title: "A country is hidden",
    hint: "You won't see country lines — only the Earth.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0" />
        <path d="M12 11v2" />
      </svg>
    ),
    title: "Tap a guess",
    hint: "We tell you how many miles away you are.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    ),
    title: "Hot or cold",
    hint: "Warmer means closer. Each miss also gives a clue.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6z" />
      </svg>
    ),
    title: "Five guesses",
    hint: "Find it sooner for a higher score.",
  },
];

export function HuntWelcomeModal({ onClose }: HuntWelcomeModalProps) {
  const unlimited = isUnlimitedPlaysEnabled();

  return (
    <WelcomeModalShell
      titleId="hunt-welcome-title"
      title="Hunt the country"
      tagline="One secret country. Guess until you find it."
      steps={STEPS}
      footnote={
        unlimited
          ? "Test mode — you can play again anytime."
          : "One Hunt per day. Find it sooner for more points."
      }
      ctaLabel="Start hunting"
      onClose={onClose}
    />
  );
}
