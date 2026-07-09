import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentShell } from "@/components/seo/ContentShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOW_TO_GUIDES, type HowToGuide } from "@/lib/how-to-play";
import type { GameModeKey } from "@/lib/product-facts";
import { breadcrumbSchema, howToSchema } from "@/lib/seo-schema";

const MODES = Object.keys(HOW_TO_GUIDES) as GameModeKey[];

type PageProps = {
  params: Promise<{ mode: string }>;
};

function getGuide(mode: string): HowToGuide | null {
  if (!(mode in HOW_TO_GUIDES)) return null;
  return HOW_TO_GUIDES[mode as GameModeKey];
}

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mode } = await params;
  const guide = getGuide(mode);
  if (!guide) return { title: "How to play" };

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/how-to/${guide.slug}` },
    openGraph: {
      title: `${guide.title} · Daily Globe Games`,
      description: guide.description,
      url: `/how-to/${guide.slug}`,
    },
  };
}

export default async function HowToModePage({ params }: PageProps) {
  const { mode } = await params;
  const guide = getGuide(mode);
  if (!guide) notFound();

  const playHref =
    guide.mode === "sweep" ? "/" : guide.mode === "tap" ? "/tap" : "/hunt";

  return (
    <ContentShell>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "How to play", path: "/how-to" },
            { name: guide.title, path: `/how-to/${guide.slug}` },
          ]),
          howToSchema({
            name: guide.title,
            description: guide.description,
            path: `/how-to/${guide.slug}`,
            steps: guide.steps,
          }),
        ]}
      />

      <p className="mb-3 text-xs text-slate-500">
        <Link href="/how-to" className="text-sky-400 hover:underline">
          How to play
        </Link>
        <span className="mx-2">/</span>
        {guide.title}
      </p>

      <h1 className="mb-2 text-2xl font-semibold text-white">{guide.title}</h1>
      <p className="mb-8 text-slate-400">{guide.definition}</p>

      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-medium text-white">Steps</h2>
        <ol className="list-decimal space-y-4 pl-5">
          {guide.steps.map((step, index) => (
            <li key={step.name} id={`step-${index + 1}`} className="space-y-1">
              <p className="font-medium text-slate-200">{step.name}</p>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="text-lg font-medium text-white">Tips</h2>
        <ul className="list-disc space-y-2 pl-5">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <p className="text-slate-500">
        <Link href={playHref} className="text-sky-400 hover:underline">
          Play{" "}
          {guide.mode === "sweep"
            ? "Sweep"
            : guide.mode === "tap"
              ? "Tap"
              : "Hunt"}{" "}
          today
        </Link>
        {" · "}
        <Link href="/faq" className="text-sky-400 hover:underline">
          FAQ
        </Link>
      </p>
    </ContentShell>
  );
}
