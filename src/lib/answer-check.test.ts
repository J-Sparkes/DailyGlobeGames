import { describe, expect, it } from "vitest";
import {
  clearAnswerCheckCache,
  expandAliases,
  isCorrectAnswer,
} from "@/lib/answer-check";
import { countryById } from "@/lib/game-data";

describe("isCorrectAnswer", () => {
  const france = countryById.get("france")!;
  const uk = countryById.get("united-kingdom")!;
  const czechia = countryById.get("czechia")!;

  it("accepts canonical names and common aliases", () => {
    expect(isCorrectAnswer("France", france)).toBe(true);
    expect(isCorrectAnswer("UK", uk)).toBe(true);
    expect(isCorrectAnswer("Great Britain", uk)).toBe(true);
    expect(isCorrectAnswer("Czech Republic", czechia)).toBe(true);
  });

  it("accepts minor typos within threshold", () => {
    expect(isCorrectAnswer("Fraance", france)).toBe(true);
    expect(isCorrectAnswer("Irelnd", countryById.get("ireland")!)).toBe(true);
  });

  it("accepts accent-stripped input for accented aliases", () => {
    expect(isCorrectAnswer("Eire", countryById.get("ireland")!)).toBe(true);
    expect(isCorrectAnswer("Espana", countryById.get("spain")!)).toBe(true);
  });

  it("rejects empty and too-short guesses", () => {
    expect(isCorrectAnswer("", france)).toBe(false);
    expect(isCorrectAnswer("   ", france)).toBe(false);
    expect(isCorrectAnswer("U", uk)).toBe(false);
  });

  it("rejects clearly wrong countries", () => {
    expect(isCorrectAnswer("Germany", france)).toBe(false);
    expect(isCorrectAnswer("Japan", uk)).toBe(false);
    expect(isCorrectAnswer("Iceland", countryById.get("ireland")!)).toBe(false);
    expect(isCorrectAnswer("Iceland", countryById.get("iceland")!)).toBe(true);
  });

  it("reuses per-country fuse cache", () => {
    clearAnswerCheckCache();
    expect(isCorrectAnswer("France", france)).toBe(true);
    expect(isCorrectAnswer("France", france)).toBe(true);
  });
});

describe("expandAliases", () => {
  it("adds accent-stripped variants", () => {
    const expanded = expandAliases(["Éire", "España"]);
    expect(expanded).toContain("Éire");
    expect(expanded).toContain("Eire");
    expect(expanded).toContain("España");
    expect(expanded).toContain("Espana");
  });
});
