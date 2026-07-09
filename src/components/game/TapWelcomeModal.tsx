"use client";

import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import {
  WelcomeModalShell,
  type WelcomeStep,
} from "@/components/game/WelcomeModalShell";

interface TapWelcomeModalProps {
  onClose: () => void;
}

const STEPS: WelcomeStep[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 6h16M4 12h10M4 18h6" />
      </svg>
    ),
    title: "Read the clue",
    hint: "Five locations. Same five for everyone.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    ),
    title: "Hold to lock in",
    hint: "Spin the globe, then press and hold your guess.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: "Closer = more pts",
    hint: "0–100 per round. Later rounds multiply.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 9h12M6 15h8" />
        <rect x="3" y="4" width="18" height="16" rx="2" />
      </svg>
    ),
    title: "Play all five",
    hint: "Max 1,000 pts — share your score grid.",
  },
];

export function TapWelcomeModal({ onClose }: TapWelcomeModalProps) {
  const unlimited = isUnlimitedPlaysEnabled();

  return (
    <WelcomeModalShell
      titleId="tap-welcome-title"
      title="Tap the map"
      tagline="Pin five daily places. Score by how close you get."
      steps={STEPS}
      footnote={
        unlimited
          ? "Test mode — replay anytime."
          : "One Tap game per day. Finish all five to share."
      }
      onClose={onClose}
    />
  );
}
