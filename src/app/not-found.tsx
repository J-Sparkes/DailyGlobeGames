import Link from "next/link";
import { ContentShell } from "@/components/seo/ContentShell";

export default function NotFound() {
  return (
    <ContentShell>
      <h1 className="mb-2 text-2xl font-semibold text-white">Page not found</h1>
      <p className="mb-6 text-slate-400">
        That URL is not part of Daily Globe Games. Try one of today&apos;s
        puzzles or a help page below.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <Link href="/" className="text-sky-400 hover:underline">
            Play Sweep
          </Link>
        </li>
        <li>
          <Link href="/tap" className="text-sky-400 hover:underline">
            Play Tap
          </Link>
        </li>
        <li>
          <Link href="/hunt" className="text-sky-400 hover:underline">
            Play Hunt
          </Link>
        </li>
        <li>
          <Link href="/about" className="text-sky-400 hover:underline">
            About
          </Link>
        </li>
        <li>
          <Link href="/faq" className="text-sky-400 hover:underline">
            FAQ
          </Link>
        </li>
        <li>
          <Link href="/how-to" className="text-sky-400 hover:underline">
            How to play
          </Link>
        </li>
      </ul>
    </ContentShell>
  );
}
