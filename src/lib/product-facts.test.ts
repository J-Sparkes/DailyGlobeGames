import { describe, expect, it } from "vitest";
import {
  FAQ_ITEMS,
  MODE_DEFINITIONS,
  PRODUCT_SUMMARY,
  buildLlmsFullTxt,
  buildLlmsTxt,
} from "@/lib/product-facts";

describe("product-facts", () => {
  it("keeps stable mode definitions", () => {
    expect(MODE_DEFINITIONS.sweep.definition).toContain("border");
    expect(MODE_DEFINITIONS.tap.definition).toContain("five rounds");
    expect(MODE_DEFINITIONS.hunt.definition).toContain("five guesses");
  });

  it("builds llms.txt with modes and docs", () => {
    const text = buildLlmsTxt();
    expect(text).toContain(PRODUCT_SUMMARY);
    expect(text).toContain("/llms-full.txt");
    expect(text).toContain("/faq");
    expect(text).toContain("Sweep");
  });

  it("builds llms-full.txt with FAQ answers", () => {
    const text = buildLlmsFullTxt();
    expect(FAQ_ITEMS.length).toBeGreaterThan(5);
    expect(text).toContain(FAQ_ITEMS[0].question);
    expect(text).toContain("Citation guidance");
  });
});
