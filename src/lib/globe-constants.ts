export const EMPTY_STRING_SET = new Set<string>();

export function setFromArrayStable(
  prev: Set<string>,
  ids: readonly string[],
): Set<string> {
  if (ids.length === 0) return EMPTY_STRING_SET;
  if (prev.size === ids.length && ids.every((id) => prev.has(id))) return prev;
  return new Set(ids);
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}
