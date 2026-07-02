import { describe, expect, it } from "vitest";
import { getServerSweepStart } from "@/lib/server/daily-engine";

describe("server daily engine", () => {
  it("picks a deterministic sweep start for a date", () => {
    const start = getServerSweepStart("2026-06-30");
    expect(start.id).toBeTruthy();
    expect(start.inDailyPool).toBe(true);
  });
});
