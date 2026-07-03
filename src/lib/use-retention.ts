"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type CalendarStreakInfo,
  getLocalCalendarStreak,
} from "@/lib/calendar-streak";
import { getStreakFreezeMonth } from "@/lib/retention-storage";
import { getTodayTrifecta, type TrifectaStatus } from "@/lib/trifecta";

export function useRetention() {
  const [calendarStreak, setCalendarStreak] = useState<CalendarStreakInfo>(() =>
    getLocalCalendarStreak(getStreakFreezeMonth()),
  );
  const [trifecta, setTrifecta] = useState<TrifectaStatus>(() => getTodayTrifecta());

  const refresh = useCallback(() => {
    setCalendarStreak(getLocalCalendarStreak(getStreakFreezeMonth()));
    setTrifecta(getTodayTrifecta());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    const onRetention = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("retention-update", onRetention);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("retention-update", onRetention);
    };
  }, [refresh]);

  return { calendarStreak, trifecta, refresh };
}
