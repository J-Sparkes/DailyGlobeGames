import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "@/components/seo/ContentShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { UPDATES } from "@/lib/updates";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Product updates and changelog for Daily Globe Games — Sweep, Tap, and Hunt.",
  alternates: { canonical: "/updates" },
  openGraph: {
    title: "Updates · Daily Globe Games",
    description:
      "What changed in Daily Globe Games — gameplay, mobile UX, and public docs.",
    url: "/updates",
  },
};

export default function UpdatesPage() {
  return (
    <ContentShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Updates", path: "/updates" },
        ])}
      />
      <h1 className="mb-2 text-2xl font-semibold text-white">Updates</h1>
      <p className="mb-8 text-slate-400">
        Product changelog for Daily Globe Games. Newest changes first.
      </p>

      <div className="space-y-8">
        {UPDATES.map((entry) => (
          <article key={`${entry.date}-${entry.title}`} className="space-y-3">
            <header>
              <p className="font-stat text-xs tracking-wide text-slate-500 uppercase">
                {entry.date}
              </p>
              <h2 className="mt-1 text-lg font-medium text-white">
                {entry.title}
              </h2>
              <p className="mt-1 text-slate-400">{entry.summary}</p>
            </header>
            <ul className="list-disc space-y-1 pl-5">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mt-10 text-slate-500">
        <Link href="/about" className="text-sky-400 hover:underline">
          About Daily Globe Games
        </Link>
        {" · "}
        <Link href="/how-to" className="text-sky-400 hover:underline">
          How to play
        </Link>
      </p>
    </ContentShell>
  );
}
