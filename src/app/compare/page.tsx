import Link from "next/link";
import { CompareClient } from "@/components/growth/CompareClient";

export const metadata = {
  title: "Compare",
  description: "Compare your Daily Globe Games score with a friend.",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10 text-sm text-slate-300">
      <CompareClient />
      <p className="mt-8">
        <Link href="/" className="text-sky-400 hover:underline">
          Back to today&apos;s puzzles
        </Link>
      </p>
    </main>
  );
}
