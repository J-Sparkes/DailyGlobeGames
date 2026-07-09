import { describe, expect, it } from "vitest";
import {
  GAME_MODE_INSTRUCTIONS,
  getGameModeInstruction,
} from "@/lib/game-mode-instructions";

describe("game-mode-instructions", () => {
  it("returns mode-specific copy", () => {
    expect(getGameModeInstruction("sweep")).toBe(GAME_MODE_INSTRUCTIONS.sweep);
    expect(getGameModeInstruction("tap")).toBe(GAME_MODE_INSTRUCTIONS.tap);
    expect(getGameModeInstruction("hunt")).toBe(GAME_MODE_INSTRUCTIONS.hunt);
  });
});
