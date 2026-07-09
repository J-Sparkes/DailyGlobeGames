"use client";

import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import {
  WelcomeModalShell,
  type WelcomeStep,
} from "@/components/game/WelcomeModalShell";

interface WelcomeModalProps {
  onClose: () => void;
}

const STEPS: WelcomeStep[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    title: "Spot the glow",
    hint: "Name today's highlighted country to start.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h16M12 4v16" />
      </svg>
    ),
    title: "Chain borders",
    hint: "Claim neighbors, then type each new country.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
    title: "Spin the globe",
    hint: "No labels — use terrain and coastlines.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    ),
    title: "One miss ends it",
    hint: "Build the longest streak you can.",
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const unlimited = isUnlimitedPlaysEnabled();

  return (
    <WelcomeModalShell
      titleId="welcome-title"
      title="Sweep the map"
      tagline="One daily start country. How far can your border chain go?"
      steps={STEPS}
      footnote={
        unlimited
          ? "Test mode — replay anytime."
          : "One sweep per day. Share your streak when you're done."
      }
      onClose={onClose}
    />
  );
}
