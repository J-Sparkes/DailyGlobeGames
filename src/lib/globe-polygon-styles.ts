export type GeographyRole =
  | "claimed"
  | "highlight"
  | "clickable"
  | "neighbor"
  | "success"
  | "invalid"
  | "hidden";

export interface PolygonStyle {
  capColor: string;
  strokeColor: string;
  altitude: number;
}

const CAP_COLORS: Record<GeographyRole, string> = {
  claimed: "rgba(56, 189, 248, 0.22)",
  highlight: "rgba(250, 204, 21, 0.55)",
  clickable: "rgba(255, 255, 255, 0.24)",
  neighbor: "rgba(255, 255, 255, 0.12)",
  success: "rgba(74, 222, 128, 0.55)",
  invalid: "rgba(248, 113, 113, 0.45)",
  hidden: "rgba(0, 0, 0, 0)",
};

const STROKE_COLORS: Record<GeographyRole, string> = {
  claimed: "rgba(125, 211, 252, 0.95)",
  highlight: "rgba(0, 0, 0, 0)",
  clickable: "rgba(0, 0, 0, 0)",
  neighbor: "rgba(0, 0, 0, 0)",
  success: "rgba(34, 197, 94, 0.9)",
  invalid: "rgba(239, 68, 68, 0.85)",
  hidden: "rgba(0, 0, 0, 0)",
};

function baseAltitude(role: GeographyRole, touch: boolean): number {
  switch (role) {
    case "highlight":
      return 0.02;
    case "claimed":
      return 0.012;
    case "clickable":
      return touch ? 0.012 : 0.008;
    case "neighbor":
      return touch ? 0.01 : 0.006;
    case "success":
      return 0.018;
    case "invalid":
      return 0.014;
    default:
      return 0.001;
  }
}

export function getGeographyRole(
  countryId: string,
  claimedIds: Set<string>,
  highlightId: string | null,
  clickableIds: Set<string>,
  hoverId: string | null,
  touch: boolean,
  flashSuccessId?: string | null,
  flashInvalidId?: string | null,
): GeographyRole {
  if (flashSuccessId === countryId) return "success";
  if (flashInvalidId === countryId) return "invalid";
  if (claimedIds.has(countryId)) return "claimed";
  if (highlightId === countryId) return "highlight";
  if (clickableIds.has(countryId)) {
    if (!touch && hoverId === countryId) return "clickable";
    return "neighbor";
  }
  return "hidden";
}

export function buildPolygonStyle(
  role: GeographyRole,
  touch: boolean,
  pulseHighlight: boolean,
): PolygonStyle {
  const altitude =
    baseAltitude(role, touch) +
    (role === "highlight" && pulseHighlight ? 0.006 : 0);

  return {
    capColor: CAP_COLORS[role],
    strokeColor: STROKE_COLORS[role],
    altitude,
  };
}

export function buildPolygonStyleMap(
  countryIds: string[],
  claimedIds: Set<string>,
  highlightId: string | null,
  clickableIds: Set<string>,
  hoverId: string | null,
  touch: boolean,
  pulseHighlight: boolean,
  flashSuccessId?: string | null,
  flashInvalidId?: string | null,
): Map<string, PolygonStyle> {
  const styles = new Map<string, PolygonStyle>();

  for (const countryId of countryIds) {
    const role = getGeographyRole(
      countryId,
      claimedIds,
      highlightId,
      clickableIds,
      hoverId,
      touch,
      flashSuccessId,
      flashInvalidId,
    );
    styles.set(
      countryId,
      buildPolygonStyle(role, touch, pulseHighlight),
    );
  }

  return styles;
}

export function buildHuntPolygonStyleMap(
  countryIds: string[],
  guessedIds: Set<string>,
  hiddenCountryId: string | null,
  revealHidden: boolean,
  won: boolean,
  hoverId: string | null,
  touch: boolean,
  interactive: boolean,
): Map<string, PolygonStyle> {
  const styles = new Map<string, PolygonStyle>();

  for (const countryId of countryIds) {
    if (revealHidden && hiddenCountryId === countryId) {
      styles.set(countryId, {
        capColor: won ? "rgba(74, 222, 128, 0.45)" : "rgba(251, 191, 36, 0.45)",
        strokeColor: won ? "rgba(74, 222, 128, 0.95)" : "rgba(251, 191, 36, 0.95)",
        altitude: 0.02,
      });
      continue;
    }

    if (guessedIds.has(countryId)) {
      styles.set(countryId, {
        capColor: "rgba(248, 113, 113, 0.2)",
        strokeColor: "rgba(0, 0, 0, 0)",
        altitude: 0.008,
      });
      continue;
    }

    if (!touch && hoverId === countryId && interactive) {
      styles.set(countryId, {
        capColor: "rgba(255, 255, 255, 0.18)",
        strokeColor: "rgba(0, 0, 0, 0)",
        altitude: 0.006,
      });
      continue;
    }

    styles.set(countryId, {
      capColor: "rgba(0, 0, 0, 0)",
      strokeColor: "rgba(0, 0, 0, 0)",
      altitude: 0.001,
    });
  }

  return styles;
}
