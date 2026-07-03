import { getDateSeed } from "@/lib/daily-seed";

export function isArchiveDate(date: string): boolean {
  return date < getDateSeed();
}

export function isArchivePlaySession(date: string): boolean {
  return isArchiveDate(date);
}

/** Past dates available in archive (excludes today) */
export function getArchiveDateOptions(days = 90): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    d.setUTCDate(d.getUTCDate() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}
