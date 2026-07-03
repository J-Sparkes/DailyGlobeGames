"use client";

import type { CSSProperties, ReactNode } from "react";
import { MenuButton } from "@/components/menu/MenuButton";

export function HudLayer({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {children}
    </div>
  );
}

export function HudSpacer() {
  return <div className="min-h-0 flex-1" />;
}

export function HudAnchor({
  children,
  position,
  keyboardInset = 0,
}: {
  children: ReactNode;
  position: "top" | "bottom";
  keyboardInset?: number;
}) {
  const style: CSSProperties | undefined =
    position === "bottom" && keyboardInset > 0
      ? { paddingBottom: `calc(0.5rem + ${keyboardInset}px)` }
      : undefined;

  return (
    <div
      className={
        position === "top"
          ? "hud-slot hud-slot--top shrink-0"
          : "hud-slot hud-slot--bottom shrink-0"
      }
      style={style}
    >
      {children}
    </div>
  );
}

export function HudPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hud-panel pointer-events-auto ${className}`.trim()}>
      {children}
    </div>
  );
}

export function HudBrand({ date }: { date?: string }) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-[var(--ui-text-primary)] uppercase">
        Daily Globe
      </span>
      {date && (
        <span className="font-stat mt-0.5 rounded bg-[var(--ui-surface-raised)] px-1.5 py-px text-[10px] text-[var(--ui-text-muted)]">
          {date}
        </span>
      )}
    </div>
  );
}

export function HudToolbar({
  children,
  stat,
  secondaryStat,
  date,
  prompt,
  meta,
  onMenuOpen,
}: {
  children?: ReactNode;
  stat?: { label: string; value: string | number; pop?: boolean };
  secondaryStat?: { label: string; value: string | number; pop?: boolean };
  date?: string;
  prompt?: ReactNode;
  meta?: ReactNode;
  onMenuOpen: () => void;
}) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-3">
      <div className="flex min-w-0 items-center gap-2.5 justify-self-start sm:gap-3">
        <HudBrand date={date} />
        {(prompt || meta) && (
          <div className="min-w-0 border-l border-[var(--ui-border-subtle)] pl-2.5 sm:pl-3">
            {prompt && (
              <p className="line-clamp-2 text-xs leading-snug text-[var(--ui-text-primary)] sm:text-sm">
                {prompt}
              </p>
            )}
            {meta && (
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-[var(--ui-text-muted)] sm:text-xs">
                {meta}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="justify-self-center shrink-0">{children}</div>

      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        {secondaryStat && (
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">
              {secondaryStat.label}
            </p>
            <p
              className={`font-stat text-lg font-semibold leading-none text-[var(--ui-accent-warm)] ${
                secondaryStat.pop ? "streak-pop" : ""
              }`}
            >
              {secondaryStat.value}
            </p>
          </div>
        )}
        {stat && (
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">
              {stat.label}
            </p>
            <p
              className={`font-stat text-lg font-semibold leading-none text-[var(--ui-text-primary)] ${
                stat.pop ? "streak-pop" : ""
              }`}
            >
              {stat.value}
            </p>
          </div>
        )}
        <MenuButton onClick={onMenuOpen} />
      </div>
    </div>
  );
}

export function HudBadge({ children }: { children: ReactNode }) {
  return (
    <span className="font-stat shrink-0 rounded-md bg-[var(--ui-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ui-text-muted)]">
      {children}
    </span>
  );
}

export function HudScroll({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto max-h-[min(38dvh,18rem)] overflow-y-auto overscroll-contain">
      {children}
    </div>
  );
}

export function DailyDateStaleBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="pointer-events-auto mb-2 w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      <p>A new daily puzzle is available.</p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-1 font-semibold text-amber-200 underline"
      >
        Refresh to play today&apos;s puzzle
      </button>
    </div>
  );
}

/** Screen-reader announcements for phase changes */
export function GameLiveRegion({ message }: { message: string }) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
