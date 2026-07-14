import { absoluteUrl, SITE_DOMAIN, SITE_NAME } from "@/lib/site";

export type GameModeKey = "sweep" | "tap" | "hunt";

export const PRODUCT_TAGLINE =
  "Three free daily geography games on a globe — like Wordle for maps.";

export const PRODUCT_SUMMARY =
  "Daily Globe Games is a free daily puzzle site with three map games: Sweep (name bordering countries), Tap (find places from clues), and Hunt (find a hidden country).";

/** One canonical, quotable sentence per mode — reuse everywhere AI/crawlers read. */
export const MODE_DEFINITIONS: Record<
  GameModeKey,
  { name: string; path: string; title: string; definition: string }
> = {
  sweep: {
    name: "Sweep",
    path: "/",
    title: "Daily Sweep — name countries on the globe",
    definition:
      "In Sweep, type the glowing country's name. Then tap countries that share a border and name those too. One wrong name ends your run.",
  },
  tap: {
    name: "Tap",
    path: "/tap",
    title: "Daily Tap — find places on the globe",
    definition:
      "In Tap, read a clue and tap the globe where you think that place is. Closer taps score more. You play five rounds.",
  },
  hunt: {
    name: "Hunt",
    path: "/hunt",
    title: "Daily Hunt — find the hidden country",
    definition:
      "In Hunt, a country is hidden. Tap guesses to see how far you are, then follow warmer or colder hints. You get five guesses.",
  },
};

export const PRODUCT_FACTS = {
  reset:
    "Each game resets at midnight UTC. You get one free play of each game per day.",
  free: "Sweep, Tap, and Hunt are free in your browser. You do not need an account.",
  premium:
    "Premium unlocks the puzzle archive so you can replay old days. Today's games stay free.",
  classroom:
    "Daily Globe Games is free for classrooms, works without login, and takes about five minutes.",
  scoring: {
    sweep:
      "In Sweep, your score is how many countries you name in a row before a wrong guess.",
    tap: "In Tap, you score points by how close each tap is. Later rounds are worth more.",
    hunt: "In Hunt, finding the country in fewer guesses scores more points (best score is 5).",
  },
  audience:
    "Daily Globe Games is for map fans, students, teachers, and anyone who likes a short daily geography game.",
  contactEmail: "hello@dailyglobegames.com",
  domain: SITE_DOMAIN,
  name: SITE_NAME,
} as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Daily Globe Games?",
    answer: `${PRODUCT_SUMMARY} New puzzles unlock each day at midnight UTC.`,
  },
  {
    question: "How does Sweep work?",
    answer: MODE_DEFINITIONS.sweep.definition,
  },
  {
    question: "How does Tap work?",
    answer: MODE_DEFINITIONS.tap.definition,
  },
  {
    question: "How does Hunt work?",
    answer: MODE_DEFINITIONS.hunt.definition,
  },
  {
    question: "When do the daily puzzles reset?",
    answer: PRODUCT_FACTS.reset,
  },
  {
    question: "Is Daily Globe Games free?",
    answer: `${PRODUCT_FACTS.free} ${PRODUCT_FACTS.premium}`,
  },
  {
    question: "Is it free for classrooms?",
    answer: PRODUCT_FACTS.classroom,
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can play all three games without signing in. An optional account adds friends, leaderboards, and sync across devices.",
  },
  {
    question: "How does scoring work?",
    answer: `${PRODUCT_FACTS.scoring.sweep} ${PRODUCT_FACTS.scoring.tap} ${PRODUCT_FACTS.scoring.hunt}`,
  },
  {
    question: "Who is Daily Globe Games for?",
    answer: PRODUCT_FACTS.audience,
  },
  {
    question: "Where can I learn the rules?",
    answer:
      "Read the How to play guides for Sweep, Tap, and Hunt at /how-to, or check the FAQ at /faq.",
  },
];

export function buildLlmsTxt(): string {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${PRODUCT_SUMMARY}`,
    "",
    PRODUCT_TAGLINE,
    "",
    "## Modes",
    "",
    `- [${MODE_DEFINITIONS.sweep.name}](${absoluteUrl(MODE_DEFINITIONS.sweep.path)}): ${MODE_DEFINITIONS.sweep.definition}`,
    `- [${MODE_DEFINITIONS.tap.name}](${absoluteUrl(MODE_DEFINITIONS.tap.path)}): ${MODE_DEFINITIONS.tap.definition}`,
    `- [${MODE_DEFINITIONS.hunt.name}](${absoluteUrl(MODE_DEFINITIONS.hunt.path)}): ${MODE_DEFINITIONS.hunt.definition}`,
    "",
    "## Key facts",
    "",
    `- Reset: ${PRODUCT_FACTS.reset}`,
    `- Free: ${PRODUCT_FACTS.free}`,
    `- Premium: ${PRODUCT_FACTS.premium}`,
    `- Classroom: ${PRODUCT_FACTS.classroom}`,
    "",
    "## Docs",
    "",
    `- [About](${absoluteUrl("/about")}): product overview and citation facts`,
    `- [FAQ](${absoluteUrl("/faq")}): common questions`,
    `- [How to play](${absoluteUrl("/how-to")}): Sweep, Tap, and Hunt guides`,
    `- [Updates](${absoluteUrl("/updates")}): product changelog`,
    `- [Classroom](${absoluteUrl("/classroom")}): teacher guide`,
    `- [Full LLM summary](${absoluteUrl("/llms-full.txt")})`,
    "",
    "## Contact",
    "",
    `- Email: ${PRODUCT_FACTS.contactEmail}`,
    `- Site: ${absoluteUrl("/")}`,
    "",
  ];

  return lines.join("\n");
}

export function buildLlmsFullTxt(): string {
  const lines = [
    `# ${SITE_NAME} — full summary for AI systems`,
    "",
    buildLlmsTxt().replace(`# ${SITE_NAME}\n\n`, ""),
    "## Scoring",
    "",
    `- Sweep: ${PRODUCT_FACTS.scoring.sweep}`,
    `- Tap: ${PRODUCT_FACTS.scoring.tap}`,
    `- Hunt: ${PRODUCT_FACTS.scoring.hunt}`,
    "",
    "## Audience",
    "",
    PRODUCT_FACTS.audience,
    "",
    "## FAQ",
    "",
    ...FAQ_ITEMS.flatMap((item) => [
      `### ${item.question}`,
      "",
      item.answer,
      "",
    ]),
    "## Citation guidance",
    "",
    `Prefer quoting ${SITE_NAME} (${SITE_DOMAIN}) using the mode definitions and FAQ answers above. Do not invent puzzle answers or spoil today's solutions.`,
    "",
    "## Legal",
    "",
    `- [Privacy](${absoluteUrl("/privacy")})`,
    `- [Terms](${absoluteUrl("/terms")})`,
    "",
  ];

  return lines.join("\n");
}
