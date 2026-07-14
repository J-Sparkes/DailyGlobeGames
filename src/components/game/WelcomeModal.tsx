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
    title: "Find the glow",
    hint: "Type the name of the glowing country.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h16M12 4v16" />
      </svg>
    ),
    title: "Pick a neighbor",
    hint: "Tap a country next door, then type its name.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    ),
    title: "Spin the globe",
    hint: "Move the map around. Names are hidden on purpose.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    ),
    title: "One miss ends it",
    hint: "A wrong name stops your run. Get as many as you can.",
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const unlimited = isUnlimitedPlaysEnabled();

  return (
    <WelcomeModalShell
      titleId="welcome-title"
      title="Sweep the map"
      tagline="Name countries that touch. Keep going until you miss."
      steps={STEPS}
      footnote={
        unlimited
          ? "Test mode — you can play again anytime."
          : "One Sweep per day. Share your score when you finish."
      }
      onClose={onClose}
    />
  );
}
