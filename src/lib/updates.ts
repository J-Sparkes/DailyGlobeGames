export type UpdateEntry = {
  date: string;
  title: string;
  summary: string;
  items: string[];
};

/** Public product changelog — newest first. */
export const UPDATES: UpdateEntry[] = [
  {
    date: "2026-07-09",
    title: "Mobile HUD polish and SEO foundations",
    summary:
      "Clearer mobile instructions, mode navigation, and public pages that search engines and AI systems can cite.",
    items: [
      "Centered mobile mode switcher below the top bar",
      "Bottom instruction card with live gameplay prompts",
      "About, FAQ, how-to guides, llms.txt, and structured data",
    ],
  },
  {
    date: "2026-07-09",
    title: "Gameplay polish and Hunt expansion",
    summary:
      "Richer Hunt feedback, Tap hold-to-confirm, and smoother end-of-game results.",
    items: [
      "Hunt: five guesses, trivia facts, and clearer guess tracking",
      "Tap: hold-to-confirm pins and reveal arcs",
      "Shared result overlays across Sweep, Tap, and Hunt",
    ],
  },
  {
    date: "2026-07-03",
    title: "Daily Globe Games rebrand and retention",
    summary:
      "Product renamed to Daily Globe Games with streaks, trifecta, and growth surfaces.",
    items: [
      "Cross-mode day streaks and trifecta nudges",
      "Classroom guide and archive Premium path",
      "Share cards and friend compare links",
    ],
  },
  {
    date: "2026-07-02",
    title: "Server-backed daily puzzles",
    summary:
      "One shared puzzle per mode per UTC day with server validation for fair play.",
    items: [
      "Deterministic daily seeds for Sweep, Tap, and Hunt",
      "Guest play with optional accounts",
      "Spoiler-free share lines for social growth",
    ],
  },
  {
    date: "2026-07-01",
    title: "Three modes on one globe",
    summary:
      "Launch of Sweep, Tap, and Hunt.",
    items: [
      "Sweep, landmark Tap, and hidden-country Hunt",
      "Persistent globe camera across mode switches",
      "Browser-first play with no app install",
    ],
  },
];
