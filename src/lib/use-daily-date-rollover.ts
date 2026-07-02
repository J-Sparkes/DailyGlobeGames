"use client";

import { useEffect, useState } from "react";
import { isDateSeedStale } from "@/lib/daily-date";

export function useDailyDateRollover(mountedDateSeed: string): boolean {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const check = () => {
      setStale(isDateSeedStale(mountedDateSeed));
    };

    check();
    const interval = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [mountedDateSeed]);

  return stale;
}
