import Link from "next/link";

const LINKS = [
  { href: "/", label: "Sweep" },
  { href: "/tap", label: "Tap" },
  { href: "/hunt", label: "Hunt" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/how-to", label: "How to play" },
  { href: "/updates", label: "Updates" },
  { href: "/classroom", label: "Classroom" },
  { href: "/archive", label: "Archive" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/llms.txt", label: "llms.txt" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
      <nav aria-label="Site">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sky-400 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-4">
        © {new Date().getFullYear()} Daily Globe Games · dailyglobegames.com
      </p>
    </footer>
  );
}
