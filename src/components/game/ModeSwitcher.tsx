"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrifectaDots } from "@/components/game/TrifectaNudge";
import { useRetention } from "@/lib/use-retention";

const MODES = [
  {
    href: "/",
    label: "Sweep",
    shortLabel: "Sweep",
    match: (path: string) => path === "/",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    ),
  },
  {
    href: "/tap",
    label: "Tap",
    shortLabel: "Tap",
    match: (path: string) => path.startsWith("/tap"),
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    ),
  },
  {
    href: "/hunt",
    label: "Hunt",
    shortLabel: "Hunt",
    match: (path: string) => path.startsWith("/hunt"),
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
] as const;

export function ModeSwitcher({
  variant = "default",
}: {
  variant?: "default" | "dock";
}) {
  const pathname = usePathname();
  const { trifecta } = useRetention();

  const linkClass = (active: boolean) =>
    `touch-target flex shrink-0 items-center justify-center gap-1 rounded-md font-semibold uppercase transition ${
      variant === "dock"
        ? `min-h-9 min-w-9 px-2 text-[10px] tracking-wide ${
            active
              ? "bg-[var(--ui-accent-primary)] text-white"
              : "text-[var(--ui-text-muted)] hover:bg-white/10 hover:text-[var(--ui-text-primary)]"
          }`
        : `gap-1.5 px-2.5 py-1.5 text-xs tracking-wide ${
            active
              ? "bg-[var(--ui-accent-primary)] text-white"
              : "text-[var(--ui-text-muted)] hover:bg-white/10 hover:text-[var(--ui-text-primary)]"
          }`
    }`;

  if (variant === "dock") {
    return (
      <nav
        className="hud-mobile-dock__modes"
        aria-label="Game mode"
      >
        <div className="flex items-center gap-0.5">
          {MODES.map((mode) => {
            const active = mode.match(pathname);
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={linkClass(active)}
                aria-current={active ? "page" : undefined}
                aria-label={mode.label}
                title={mode.label}
              >
                {mode.icon}
              </Link>
            );
          })}
        </div>
        <TrifectaDots status={trifecta} />
      </nav>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <nav
        className="shrink-0 rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] p-0.5"
        aria-label="Game mode"
      >
        <div className="flex items-center gap-0.5">
          {MODES.map((mode) => {
            const active = mode.match(pathname);
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={linkClass(active)}
                aria-current={active ? "page" : undefined}
                title={mode.label}
              >
                {mode.icon}
                <span className="inline sm:inline">{mode.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <TrifectaDots status={trifecta} />
    </div>
  );
}
