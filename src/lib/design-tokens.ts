/** Observatory Dark — shared UI + map tokens */

export const UI = {
  bgDeep: "#06080C",
  surfaceHud: "#0D1117",
  surfaceRaised: "#151B26",
  borderSubtle: "#1C2333",
  textPrimary: "#E8ECF4",
  textMuted: "#8B95A8",
  accentPrimary: "#2E9FD4",
  accentWarm: "#F5A623",
  success: "#3DDB87",
  error: "#FF5C5C",
} as const;

export const MAP = {
  ocean: "#0A1628",
  inactive: {
    cap: "rgba(20, 28, 40, 0.55)",
    stroke: "rgba(36, 48, 68, 0.4)",
  },
  inFocus: {
    cap: "rgba(42, 52, 72, 0.7)",
    stroke: "rgba(74, 90, 114, 0.8)",
  },
  highlight: {
    cap: "rgba(245, 166, 35, 0.5)",
    stroke: "rgba(255, 209, 102, 0.95)",
  },
  /** Swept territories — violet reads clearly against land and ocean */
  claimed: {
    cap: "rgba(139, 92, 246, 0.44)",
    stroke: "rgba(196, 181, 253, 0.92)",
  },
  /** Frontier neighbors — same hue, lighter fill so overlap stays readable */
  connecting: {
    cap: "rgba(139, 92, 246, 0.14)",
    stroke: "rgba(167, 139, 250, 0.72)",
  },
  clickable: {
    cap: "rgba(255, 255, 255, 0.16)",
    stroke: "rgba(255, 255, 255, 0.65)",
  },
  neighbor: {
    cap: "rgba(255, 255, 255, 0.1)",
    stroke: "rgba(255, 255, 255, 0.35)",
  },
  success: {
    cap: "rgba(255, 214, 102, 0.58)",
    stroke: "rgba(255, 236, 179, 0.95)",
  },
  invalid: {
    cap: "rgba(255, 92, 92, 0.45)",
    stroke: "rgba(255, 92, 92, 0.85)",
  },
} as const;

export const GLOBE = {
  imageUrl: "/earth-satellite.jpg",
  atmosphereColor: "lightskyblue",
  atmosphereAltitude: 0.12,
} as const;
