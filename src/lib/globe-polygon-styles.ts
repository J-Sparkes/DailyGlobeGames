import { MAP } from "@/lib/design-tokens";

export type GeographyRole =
  | "claimed"
  | "highlight"
  | "connecting"
  | "success"
  | "invalid"
  | "hidden";

export interface PolygonStyle {
  capColor: string;
  strokeColor: string;
  altitude: number;
}

/** Invisible polygon kept only for click hit-testing */
export const TRANSPARENT_POLYGON: PolygonStyle = {
  capColor: "rgba(0, 0, 0, 0)",
  strokeColor: "rgba(0, 0, 0, 0)",
  altitude: 0.001,
};

const VISIBLE_STYLES: Record<Exclude<GeographyRole, "hidden">, PolygonStyle> = {
  claimed: {
    capColor: MAP.claimed.cap,
    strokeColor: MAP.claimed.stroke,
    altitude: 0.012,
  },
  connecting: {
    capColor: MAP.connecting.cap,
    strokeColor: MAP.connecting.stroke,
    altitude: 0.008,
  },
  highlight: {
    capColor: MAP.highlight.cap,
    strokeColor: MAP.highlight.stroke,
    altitude: 0.02,
  },
  success: {
    capColor: MAP.success.cap,
    strokeColor: MAP.success.stroke,
    altitude: 0.018,
  },
  invalid: {
    capColor: MAP.invalid.cap,
    strokeColor: MAP.invalid.stroke,
    altitude: 0.014,
  },
};

export function getSweepOverlayCountryIds(
  claimedIds: Set<string>,
  highlightId: string | null,
  connectingIds: Set<string>,
  flashSuccessId?: string | null,
  flashInvalidId?: string | null,
): Set<string> {
  const ids = new Set<string>(claimedIds);
  if (highlightId) ids.add(highlightId);
  for (const id of connectingIds) ids.add(id);
  if (flashSuccessId) ids.add(flashSuccessId);
  if (flashInvalidId) ids.add(flashInvalidId);
  return ids;
}

export function getGeographyRole(
  countryId: string,
  claimedIds: Set<string>,
  highlightId: string | null,
  connectingIds: Set<string>,
  flashSuccessId?: string | null,
  flashInvalidId?: string | null,
): GeographyRole {
  if (flashSuccessId === countryId) return "success";
  if (flashInvalidId === countryId) return "invalid";
  if (claimedIds.has(countryId)) return "claimed";
  if (highlightId === countryId) return "highlight";
  if (connectingIds.has(countryId)) return "connecting";
  return "hidden";
}

export function buildPolygonStyle(role: GeographyRole): PolygonStyle {
  if (role === "hidden") return TRANSPARENT_POLYGON;
  return VISIBLE_STYLES[role];
}

/** Only countries with overlays or click targets — not the full world mesh */
export function buildPolygonStyleMap(
  claimedIds: Set<string>,
  highlightId: string | null,
  connectingIds: Set<string>,
  flashSuccessId?: string | null,
  flashInvalidId?: string | null,
): Map<string, PolygonStyle> {
  const styles = new Map<string, PolygonStyle>();
  const overlayIds = getSweepOverlayCountryIds(
    claimedIds,
    highlightId,
    connectingIds,
    flashSuccessId,
    flashInvalidId,
  );

  for (const countryId of overlayIds) {
    const role = getGeographyRole(
      countryId,
      claimedIds,
      highlightId,
      connectingIds,
      flashSuccessId,
      flashInvalidId,
    );
    if (role === "hidden") continue;
    styles.set(countryId, buildPolygonStyle(role));
  }

  return styles;
}

export function getHuntOverlayCountryIds(
  countryIds: string[],
  guessedIds: Set<string>,
  hiddenCountryId: string | null,
  revealHidden: boolean,
  interactive: boolean,
): Set<string> {
  if (interactive) {
    return new Set(countryIds);
  }

  const ids = new Set(guessedIds);
  if (revealHidden && hiddenCountryId) ids.add(hiddenCountryId);
  return ids;
}

export function buildHuntPolygonStyleMap(
  countryIds: string[],
  guessedIds: Set<string>,
  hiddenCountryId: string | null,
  revealHidden: boolean,
  won: boolean,
  interactive: boolean,
): Map<string, PolygonStyle> {
  const styles = new Map<string, PolygonStyle>();
  const overlayIds = getHuntOverlayCountryIds(
    countryIds,
    guessedIds,
    hiddenCountryId,
    revealHidden,
    interactive,
  );

  for (const countryId of overlayIds) {
    if (revealHidden && hiddenCountryId === countryId) {
      styles.set(countryId, {
        capColor: won ? MAP.success.cap : MAP.highlight.cap,
        strokeColor: won ? MAP.success.stroke : MAP.highlight.stroke,
        altitude: 0.02,
      });
      continue;
    }

    if (guessedIds.has(countryId)) {
      styles.set(countryId, {
        capColor: MAP.invalid.cap,
        strokeColor: MAP.invalid.stroke,
        altitude: 0.01,
      });
      continue;
    }

    styles.set(countryId, TRANSPARENT_POLYGON);
  }

  return styles;
}
