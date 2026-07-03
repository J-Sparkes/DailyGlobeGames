"use client";

import { useRetention } from "@/lib/use-retention";
import { useCountUp } from "@/lib/use-count-up";

export function CalendarStreakStat({
  animate = false,
  compact = false,
}: {
  animate?: boolean;
  compact?: boolean;
}) {
  const { calendarStreak } = useRetention();
  const display = useCountUp(calendarStreak.current, { enabled: animate });

  if (compact) {
    return (
      <div className="text-right">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">
          Day streak
        </p>
        <p className="font-stat text-lg font-semibold leading-none text-[var(--ui-accent-warm)]">
          {display}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-end gap-2">
      <p className="font-stat text-2xl font-semibold leading-none text-[var(--ui-accent-warm)]">
        {display}
      </p>
      <div className="pb-0.5">
        <p className="text-xs font-semibold text-[var(--ui-text-primary)]">
          Day streak
        </p>
        <p className="text-[10px] text-[var(--ui-text-muted)]">
          {calendarStreak.playedToday ? "Keep it going" : "Play any mode today"}
        </p>
      </div>
    </div>
  );
}
