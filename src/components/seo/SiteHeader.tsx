import Link from "next/link";

const NAV = [
  { href: "/", label: "Play" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/how-to", label: "How to play" },
  { href: "/classroom", label: "Classroom" },
  { href: "/updates", label: "Updates" },
] as const;

export function SiteHeader() {
  return (
    <header className="mb-8 border-b border-slate-800 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Link href="/" className="group">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase group-hover:text-slate-300">
            Daily Globe Games
          </p>
          <p className="text-sm text-slate-500">dailyglobegames.com</p>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sky-400 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
