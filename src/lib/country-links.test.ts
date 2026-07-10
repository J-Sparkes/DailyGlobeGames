import { describe, expect, it } from "vitest";
import { countryById } from "@/lib/game-data";
import {
  getLinkedCountryIds,
  hasCountryLink,
} from "@/lib/country-links";
import {
  clearBorderGraphCache,
  getFrontierCountryIds,
  loadBorderGraph,
} from "@/lib/border-graph";

describe("country maritime links", () => {
  it("allows Australia to reach New Zealand, Papua New Guinea, and Indonesia", () => {
    const australia = countryById.get("australia");
    expect(australia).toBeDefined();

    const links = getLinkedCountryIds(australia!);
    expect(links).toContain("new-zealand");
    expect(links).toContain("papua-new-guinea");
    expect(links).toContain("indonesia");
  });

  it("validates adjacency via land_borders or maritime_links", () => {
    const australia = countryById.get("australia")!;
    expect(hasCountryLink(australia, "indonesia")).toBe(true);
    expect(hasCountryLink(australia, "france")).toBe(false);
  });

  it("exposes maritime neighbors on the sweep frontier", async () => {
    clearBorderGraphCache();
    await loadBorderGraph();

    const frontier = getFrontierCountryIds(["australia"]);
    expect(frontier).toEqual(
      expect.arrayContaining(["new-zealand", "papua-new-guinea", "indonesia"]),
    );
  });
});
