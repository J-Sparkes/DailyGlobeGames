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
      className="touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-black/50 text-slate-200 transition hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-white md:h-8 md:w-8"
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
