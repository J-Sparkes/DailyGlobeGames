"use client";

import { getAllGameHistory } from "@/lib/game-history";
import { getStreakFreezeMonth } from "@/lib/retention-storage";
import { computeCalendarStreak } from "@/lib/calendar-streak";

interface ActivityHeatmapProps {
  days?: number;
}

export function ActivityHeatmap({ days = 90 }: ActivityHeatmapProps) {
  const playDates = new Set(getAllGameHistory().map((e) => e.date));
  const streak = computeCalendarStreak(
    [...playDates],
    undefined,
    getStreakFreezeMonth(),
  );

  const cells: { date: string; played: boolean }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    d.setUTCDate(d.getUTCDate() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${day}`;
    cells.push({ date, played: playDates.has(date) });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-200">Activity</p>
        <p className="font-stat text-xs text-sky-300">
          {streak.current} day streak
        </p>
      </div>
      <div
        className="grid grid-flow-col grid-rows-7 gap-0.5"
        style={{ gridTemplateColumns: `repeat(${Math.ceil(days / 7)}, 1fr)` }}
        aria-label="90 day play calendar"
      >
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={cell.date}
            className={`h-3 w-3 rounded-sm ${
              cell.played ? "bg-sky-500/80" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-500">
        Longest streak: {streak.longest} days
      </p>
    </div>
  );
}
