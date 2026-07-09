import { describe, expect, it } from "vitest";
import { HOW_TO_GUIDES, HOW_TO_INDEX } from "@/lib/how-to-play";

describe("how-to-play", () => {
  it("covers all three modes with steps", () => {
    expect(HOW_TO_INDEX).toHaveLength(3);
    for (const guide of HOW_TO_INDEX) {
      expect(guide.steps.length).toBeGreaterThanOrEqual(3);
      expect(HOW_TO_GUIDES[guide.mode].slug).toBe(guide.slug);
    }
  });
});
