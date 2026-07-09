"use client";

interface MenuButtonProps {
  onClick: () => void;
}

export function MenuButton({ onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="touch-target flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--ui-border-subtle)] bg-[color-mix(in_srgb,var(--ui-bg-deep)_50%,transparent)] text-[var(--ui-text-primary)] transition hover:border-[color-mix(in_srgb,var(--ui-accent-primary)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-accent-primary)_10%,transparent)]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}
