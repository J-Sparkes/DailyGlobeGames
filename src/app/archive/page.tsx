import Link from "next/link";
import { ArchiveClient } from "@/components/growth/ArchiveClient";

export const metadata = {
  title: "Archive",
  description: "Replay past Daily Globe Games puzzles with Premium.",
};

export default function ArchivePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-300">
      <ArchiveClient />
      <p className="mt-8">
        <Link href="/" className="text-sky-400 hover:underline">
          Play today&apos;s puzzles
        </Link>
      </p>
    </main>
  );
}
