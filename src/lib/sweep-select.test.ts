import { describe, expect, it } from "vitest";
import { canSelectFrontierCountry } from "@/lib/sweep-select";

describe("canSelectFrontierCountry", () => {
  it("allows selection during selecting phase", () => {
    expect(canSelectFrontierCountry("selecting", "fra", ["deu"])).toBe(true);
  });

  it("allows switching neighbors while naming an unclaimed target", () => {
    expect(canSelectFrontierCountry("naming", "fra", ["deu"])).toBe(true);
  });

  it("blocks selection while naming the daily start (nothing claimed yet)", () => {
    expect(canSelectFrontierCountry("naming", "deu", [])).toBe(false);
  });

  it("blocks selection while naming an already-claimed country", () => {
    expect(canSelectFrontierCountry("naming", "deu", ["deu", "fra"])).toBe(
      false,
    );
  });
});
