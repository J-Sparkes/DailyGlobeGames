import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const MODE_LABELS = {
  sweep: "Sweep",
  tap: "Tap",
  hunt: "Hunt",
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = (searchParams.get("mode") ?? "sweep") as keyof typeof MODE_LABELS;
  const date = searchParams.get("date") ?? "";
  const score = searchParams.get("score") ?? "0";
  const subtitle = searchParams.get("subtitle") ?? "";
  const label = MODE_LABELS[mode] ?? "Sweep";

  const scoreLabel =
    mode === "sweep"
      ? score === "1"
        ? "country swept"
        : "countries swept"
      : "points";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "linear-gradient(145deg, #06080c 0%, #0c1420 55%, #0a1628 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 22, color: "#94a3b8", letterSpacing: "0.12em" }}>
            DAILY GLOBE GAMES
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{label}</div>
          {date && (
            <div style={{ fontSize: 20, color: "#64748b" }}>{date}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#38bdf8", lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: 28, color: "#cbd5e1" }}>{scoreLabel}</div>
          {subtitle && (
            <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 8 }}>{subtitle}</div>
          )}
        </div>

        <div style={{ fontSize: 20, color: "#475569" }}>dailyglobegames.com</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
