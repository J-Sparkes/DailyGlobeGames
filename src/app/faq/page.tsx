import type { Metadata } from "next";
import Link from "next/link";
import { ContentShell } from "@/components/seo/ContentShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/lib/product-facts";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo-schema";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Daily Globe Games — Sweep, Tap, Hunt, daily resets, classrooms, and scoring.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ · Daily Globe Games",
    description:
      "Answers about Daily Globe Games modes, free play, classrooms, and scoring.",
    url: "/faq",
  },
};

export default function FaqPage() {
  return (
    <ContentShell>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqPageSchema(FAQ_ITEMS),
        ]}
      />

      <h1 className="mb-2 text-2xl font-semibold text-white">
        Frequently asked questions
      </h1>
      <p className="mb-8 text-slate-400">
        Quick answers about Daily Globe Games. For a fuller product overview, see{" "}
        <Link href="/about" className="text-sky-400 hover:underline">
          About
        </Link>
        ,{" "}
        <Link href="/how-to" className="text-sky-400 hover:underline">
          how to play
        </Link>
        , or{" "}
        <Link href="/llms.txt" className="text-sky-400 hover:underline">
          llms.txt
        </Link>
        .
      </p>

      <div className="space-y-6">
        {FAQ_ITEMS.map((item) => (
          <section key={item.question} className="space-y-2">
            <h2 className="text-lg font-medium text-white">{item.question}</h2>
            <p>{item.answer}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-slate-500">
        Still stuck?{" "}
        <a href="mailto:hello@dailyglobegames.com" className="text-sky-400">
          hello@dailyglobegames.com
        </a>
      </p>
    </ContentShell>
  );
}
