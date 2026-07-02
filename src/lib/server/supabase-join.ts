export function joinProfile(
  raw:
    | { username: string; display_name: string }
    | { username: string; display_name: string }[]
    | null
    | undefined,
): { username: string; display_name: string } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}
