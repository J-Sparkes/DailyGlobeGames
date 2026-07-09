import Link from "next/link";
import {
  MODE_DEFINITIONS,
  type GameModeKey,
} from "@/lib/product-facts";

export type GameSeoMode = GameModeKey;

export function GameSeoIntro({ mode }: { mode: GameSeoMode }) {
  const copy = MODE_DEFINITIONS[mode];

  return (
    <section className="sr-only" aria-label={`${copy.title} overview`}>
      <h1>{copy.title}</h1>
      <p>{copy.definition}</p>
      <nav aria-label="Game modes">
        <ul>
          <li>
            <Link href="/">Sweep</Link>
          </li>
          <li>
            <Link href="/tap">Tap</Link>
          </li>
          <li>
            <Link href="/hunt">Hunt</Link>
          </li>
          <li>
            <Link href="/about">About Daily Globe Games</Link>
          </li>
          <li>
            <Link href="/faq">FAQ</Link>
          </li>
          <li>
            <Link href="/how-to">How to play</Link>
          </li>
          <li>
            <Link href="/updates">Updates</Link>
          </li>
          <li>
            <Link href="/classroom">Classroom guide</Link>
          </li>
          <li>
            <Link href="/llms.txt">llms.txt</Link>
          </li>
        </ul>
      </nav>
    </section>
  );
}
