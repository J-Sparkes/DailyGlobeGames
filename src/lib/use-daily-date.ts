"use client";

import { useSearchParams } from "next/navigation";
import { getDateSeed } from "@/lib/daily-seed";

export function useDailyDate(): string {
  const params = useSearchParams();
  const param = params.get("d") ?? params.get("date");
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return param;
  }
  return getDateSeed();
}
