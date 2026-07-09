"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { primeAudio } from "@/lib/sounds";

export interface WelcomeStep {
  icon: ReactNode;
  title: string;
  hint: string;
}

export interface WelcomeModalShellProps {
  titleId: string;
  title: string;
  tagline: string;
  steps: WelcomeStep[];
  footnote: string;
  ctaLabel?: string;
  onClose: () => void;
}

export function WelcomeModalShell({
  titleId,
  title,
  tagline,
  steps,
  footnote,
  ctaLabel = "Start playing",
  onClose,
}: WelcomeModalShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
      className="welcome-backdrop pointer-events-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="welcome-panel welcome-panel--compact"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="welcome-panel__glow" aria-hidden />

        <div className="welcome-panel__body">
          <header className="welcome-panel__header">
            <p className="welcome-panel__eyebrow">How to play</p>
            <h2 id={titleId} className="welcome-panel__title">
              {title}
            </h2>
            <p className="welcome-panel__tagline">{tagline}</p>
          </header>

          <ul className="welcome-steps-grid">
            {steps.map((step) => (
              <li key={step.title} className="welcome-step">
                <div className="welcome-step__icon" aria-hidden>
                  {step.icon}
                </div>
                <p className="welcome-step__title">{step.title}</p>
                <p className="welcome-step__hint">{step.hint}</p>
              </li>
            ))}
          </ul>

          <p className="welcome-panel__footnote">{footnote}</p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              primeAudio();
              onClose();
            }}
            className="touch-target welcome-panel__cta btn-primary"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
