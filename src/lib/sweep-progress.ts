import { getDateSeed } from "@/lib/daily-seed";
import type { DailyProgress, GamePhase } from "@/lib/daily-play";
import { isPlayableCountryId } from "@/lib/game-data";

function isValidPhase(phase: unknown): phase is GamePhase {
  return phase === "naming" || phase === "selecting";
}

export function sanitizeSweepProgress(
  progress: DailyProgress,
  expectedDailyCountryId: string,
): DailyProgress {
  const date = progress.date === getDateSeed() ? progress.date : getDateSeed();
  const claimedIds = progress.claimedIds.filter(isPlayableCountryId);

  if (!isValidPhase(progress.phase)) {
    return createRecoveredProgress(date, expectedDailyCountryId, claimedIds);
  }

  if (progress.dailyCountryId !== expectedDailyCountryId) {
    return createRecoveredProgress(date, expectedDailyCountryId, claimedIds);
  }

  if (claimedIds.length === 0) {
    return {
      date,
      dailyCountryId: expectedDailyCountryId,
      claimedIds: [],
      phase: "naming",
      targetId: expectedDailyCountryId,
    };
  }

  if (progress.phase === "selecting") {
    return {
      date,
      dailyCountryId: expectedDailyCountryId,
      claimedIds,
      phase: "selecting",
      targetId: claimedIds.at(-1) ?? expectedDailyCountryId,
    };
  }

  // naming phase with at least one claimed country
  let targetId = progress.targetId;
  if (!isPlayableCountryId(targetId)) {
    targetId = expectedDailyCountryId;
  }

  if (claimedIds.includes(targetId)) {
    return {
      date,
      dailyCountryId: expectedDailyCountryId,
      claimedIds,
      phase: "selecting",
      targetId: claimedIds.at(-1) ?? expectedDailyCountryId,
    };
  }

  return {
    date,
    dailyCountryId: expectedDailyCountryId,
    claimedIds,
    phase: "naming",
    targetId,
  };
}

function createRecoveredProgress(
  date: string,
  expectedDailyCountryId: string,
  claimedIds: string[],
): DailyProgress {
  if (claimedIds.length === 0) {
    return {
      date,
      dailyCountryId: expectedDailyCountryId,
      claimedIds: [],
      phase: "naming",
      targetId: expectedDailyCountryId,
    };
  }

  return {
    date,
    dailyCountryId: expectedDailyCountryId,
    claimedIds,
    phase: "selecting",
    targetId: claimedIds.at(-1) ?? expectedDailyCountryId,
  };
}

export function isSweepDeadEnd(
  phase: GamePhase,
  claimedIds: string[],
  frontierIds: string[],
): boolean {
  return (
    phase === "selecting" &&
    claimedIds.length > 0 &&
    frontierIds.length === 0
  );
}
