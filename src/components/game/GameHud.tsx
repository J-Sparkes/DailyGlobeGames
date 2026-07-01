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

export function HudToolbar({
  children,
  stat,
  badge,
  onMenuOpen,
}: {
  children?: ReactNode;
  stat?: { label: string; value: string | number; pop?: boolean };
  badge?: ReactNode;
  onMenuOpen: () => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="shrink-0">{children}</div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {badge}
        {stat && (
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
            <p
              className={`text-lg font-semibold tabular-nums leading-none text-white ${
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

export function HudPrompt({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 w-full border-t border-white/8 pt-2 text-sm leading-relaxed text-slate-200">
      {children}
    </p>
  );
}

export function HudMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 w-full text-xs leading-snug text-slate-500">
      {children}
    </p>
  );
}

export function HudBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-400">
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
