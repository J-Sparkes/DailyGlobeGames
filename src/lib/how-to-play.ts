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
      "Learn Sweep, the Daily Globe Games border geography mode — name countries and expand across neighbors on a 3D globe.",
    definition: MODE_DEFINITIONS.sweep.definition,
    steps: [
      {
        name: "Open today's Sweep",
        text: "Go to dailyglobegames.com. A starting country is highlighted on the 3D globe.",
      },
      {
        name: "Name the highlighted country",
        text: "Type the country name and submit. Correct answers claim the country and grow your streak.",
      },
      {
        name: "Expand across borders",
        text: "Tap a glowing neighboring country, then name it. Keep expanding along valid borders.",
      },
      {
        name: "End the run",
        text: "A wrong guess ends today's Sweep. Share your streak with a spoiler-free score card.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.sweep,
      "Spin and zoom the globe to inspect borders before you guess.",
    ],
  },
  tap: {
    mode: "tap",
    slug: "tap",
    title: "How to play Tap",
    description:
      "Learn Tap, the Daily Globe Games landmark mode — read a clue and tap the globe; every kilometer counts.",
    definition: MODE_DEFINITIONS.tap.definition,
    steps: [
      {
        name: "Read the clue",
        text: "Each round shows a location prompt such as a city or landmark.",
      },
      {
        name: "Aim on the globe",
        text: "Spin and zoom to the place you think matches the clue.",
      },
      {
        name: "Confirm your tap",
        text: "Hold click (or hold on touch) to lock in your guess for that round.",
      },
      {
        name: "Play five rounds",
        text: "Score by distance across five daily rounds, then share your total.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.tap,
      "Later rounds can be worth more — stay precise when the multiplier rises.",
    ],
  },
  hunt: {
    mode: "hunt",
    slug: "hunt",
    title: "How to play Hunt",
    description:
      "Learn Hunt, the Daily Globe Games hidden-country mode — use hot-or-cold distance clues to find the secret territory.",
    definition: MODE_DEFINITIONS.hunt.definition,
    steps: [
      {
        name: "Start today's Hunt",
        text: "Open /hunt. A country is hidden somewhere on the globe.",
      },
      {
        name: "Tap a country guess",
        text: "Select a country on the globe. You get distance feedback in miles.",
      },
      {
        name: "Follow warmer or colder hints",
        text: "Use hot-or-cold clues and trivia facts to narrow the search.",
      },
      {
        name: "Solve within five guesses",
        text: "Find the hidden country in as few guesses as possible for a higher score.",
      },
    ],
    tips: [
      PRODUCT_FACTS.reset,
      PRODUCT_FACTS.scoring.hunt,
      "Fewer guesses earn a better Hunt score — best score is 5.",
    ],
  },
};

export const HOW_TO_INDEX = Object.values(HOW_TO_GUIDES);
