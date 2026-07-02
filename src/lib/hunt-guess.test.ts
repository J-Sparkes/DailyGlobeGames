import { describe, expect, it } from "vitest";
import { appendHuntGuess, buildWinningHuntGuess } from "@/lib/hunt-guess";
import type { HuntGuess } from "@/types/hunt";

describe("buildWinningHuntGuess (BUG-07 hunt win record)", () => {
  it("records the winning country at zero miles", () => {
    const guess = buildWinningHuntGuess("france", 1200);
    expect(guess.countryId).toBe("france");
    expect(guess.distanceMiles).toBe(0);
    expect(guess.warmer).toBe("warmer");
  });

  it("marks warmer as same when previous distance was also zero", () => {
    const guess = buildWinningHuntGuess("france", 0);
    expect(guess.warmer).toBe("same");
  });
});

describe("appendHuntGuess", () => {
  const wrongGuess: HuntGuess = {
    countryId: "germany",
    distanceMiles: 500,
    warmer: null,
  };

  it("appends a new guess", () => {
    const next = appendHuntGuess([], wrongGuess);
    expect(next).toHaveLength(1);
    expect(next[0]?.countryId).toBe("germany");
  });

  it("does not duplicate an existing country", () => {
    const next = appendHuntGuess([wrongGuess], wrongGuess);
    expect(next).toHaveLength(1);
  });
});
