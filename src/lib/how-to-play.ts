import type { GameModeKey } from "@/lib/product-facts";
import { MODE_DEFINITIONS, PRODUCT_FACTS } from "@/lib/product-facts";

export type HowToStep = {
  name: string;
  text: string;
};

export type HowToGuide = {
  mode: GameModeKey;
  slug: string;
  title: string;
  description: string;
  definition: string;
  steps: HowToStep[];
  tips: string[];
};

export const HOW_TO_GUIDES: Record<GameModeKey, HowToGuide> = {
  sweep: {
    mode: "sweep",
    slug: "sweep",
    title: "How to play Sweep",
    description:
      "Learn Sweep: type country names and grow across neighbors on the globe.",
    definition: MODE_DEFINITIONS.sweep.definition,
    steps: [
      {
        name: "Open today's Sweep",
        text: "Go to dailyglobegames.com. One country glows on the globe.",
      },
      {
        name: "Type the glowing country",
        text: "Type its name and press Go. If you're right, you keep it and your streak goes up.",
      },
      {
        name: "Pick a neighbor",
        text: "Tap a glowing country next door, then type that name too. Keep going country by country.",
      },
      {
        name: "When the run ends",
        text: "One wrong name ends today's Sweep. Share your streak — the card won't spoil answers.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.sweep,
      "Spin and zoom the globe so you can see the borders before you guess.",
    ],
  },
  tap: {
    mode: "tap",
    slug: "tap",
    title: "How to play Tap",
    description:
      "Learn Tap: read a clue, then tap the globe as close as you can.",
    definition: MODE_DEFINITIONS.tap.definition,
    steps: [
      {
        name: "Read the clue",
        text: "Each round names a place, like a city or famous landmark.",
      },
      {
        name: "Find it on the globe",
        text: "Spin and zoom to where you think that place is.",
      },
      {
        name: "Press and hold",
        text: "Press and hold (or hold click) to drop your pin for that round.",
      },
      {
        name: "Play five rounds",
        text: "Closer taps score more. After five rounds, share your total.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.tap,
      "Later rounds are worth more — take your time when the score boost is high.",
    ],
  },
  hunt: {
    mode: "hunt",
    slug: "hunt",
    title: "How to play Hunt",
    description:
      "Learn Hunt: find a hidden country using distance and hot-or-cold clues.",
    definition: MODE_DEFINITIONS.hunt.definition,
    steps: [
      {
        name: "Start today's Hunt",
        text: "Open /hunt. One country is hidden somewhere on the globe.",
      },
      {
        name: "Tap a country",
        text: "Pick a country. We tell you how many miles away you are.",
      },
      {
        name: "Use warmer and colder",
        text: "Warmer means closer. Each miss can also give a fun fact clue.",
      },
      {
        name: "Five tries",
        text: "Find it in as few guesses as you can. Fewer guesses means a higher score.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.hunt,
      "Fewer guesses earn more points — the best Hunt score is 5.",
    ],
  },
};

export const HOW_TO_INDEX = Object.values(HOW_TO_GUIDES);
