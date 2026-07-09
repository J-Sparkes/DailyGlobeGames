import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "@/components/seo/ContentShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOW_TO_INDEX } from "@/lib/how-to-play";
import { breadcrumbSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "How to play Daily Globe Games — guides for Sweep, Tap, and Hunt.",
  alternates: { canonical: "/how-to" },
  openGraph: {
    title: "How to play · Daily Globe Games",
    description:
      "Step-by-step guides for Sweep, Tap, and Hunt — three daily geography games.",
    url: "/how-to",
  },
};

export default function HowToIndexPage() {
  return (
    <ContentShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How to play", path: "/how-to" },
        ])}
      />
      <h1 className="mb-2 text-2xl font-semibold text-white">How to play</h1>
      <p className="mb-8 text-slate-400">
        Short guides for each Daily Globe Games mode. Pick a mode to learn the
        rules, then play today&apos;s puzzle.
      </p>

      <ul className="space-y-4">
        {HOW_TO_INDEX.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/how-to/${guide.slug}`}
              className="block rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:border-sky-500/40"
            >
              <p className="font-medium text-white">{guide.title}</p>
              <p className="mt-1 text-slate-400">{guide.definition}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentShell>
  );
}
