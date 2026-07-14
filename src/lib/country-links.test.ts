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

  it("keeps Indonesia connected beyond Oceania so Sweep does not dead-end", async () => {
    clearBorderGraphCache();
    await loadBorderGraph();

    const indonesia = countryById.get("indonesia")!;
    const links = getLinkedCountryIds(indonesia);
    expect(links).toEqual(
      expect.arrayContaining(["papua-new-guinea", "australia", "south-korea"]),
    );

    const frontier = getFrontierCountryIds(["indonesia"]);
    expect(frontier).toEqual(
      expect.arrayContaining(["papua-new-guinea", "australia", "south-korea"]),
    );
  });

  it("keeps the full country graph in one connected component", () => {
    const ids = [...countryById.keys()];
    const graph = new Map(ids.map((id) => [id, new Set()]));

    for (const id of ids) {
      const country = countryById.get(id)!;
      for (const neighbor of getLinkedCountryIds(country)) {
        graph.get(id)!.add(neighbor);
        graph.get(neighbor)?.add(id);
      }
    }

    const start = ids[0]!;
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const next of graph.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    expect(seen.size).toBe(ids.length);
  });
});
