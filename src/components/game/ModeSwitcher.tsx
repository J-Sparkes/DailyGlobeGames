"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODES = [
  { href: "/", label: "Sweep", match: (path: string) => path === "/" },
  {
    href: "/tap",
    label: "Tap",
    match: (path: string) => path.startsWith("/tap"),
  },
  {
    href: "/hunt",
    label: "Hunt",
    match: (path: string) => path.startsWith("/hunt"),
  },
] as const;

export function ModeSwitcher() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `touch-target shrink-0 min-h-8 rounded-md px-3 py-1 text-xs font-semibold tracking-wide uppercase transition ${
      active
        ? "bg-sky-500 text-white"
        : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
    }`;

  return (
    <nav
      className="shrink-0 rounded-lg border border-white/10 bg-black/50 p-0.5"
      aria-label="Game mode"
    >
      <div className="flex items-center gap-0.5">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={linkClass(mode.match(pathname))}
          >
            {mode.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
