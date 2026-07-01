import locationsData from "@/data/locations.mock.json";
import type { DailyLocation } from "@/types/location";

export function getLocationPool(): DailyLocation[] {
  return locationsData as DailyLocation[];
}
