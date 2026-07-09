import { ImageResponse } from "next/og";

export const alt = "Daily Globe Games — three daily geography games on a 3D globe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(145deg, #06080c 0%, #0c1420 55%, #0a1628 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 22,
              color: "#94a3b8",
              letterSpacing: "0.14em",
              fontWeight: 600,
            }}
          >
            DAILY GLOBE GAMES
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
            Three daily geography games on a 3D globe
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {["Sweep", "Tap", "Hunt"].map((mode) => (
            <div
              key={mode}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 22px",
                borderRadius: 12,
                border: "1px solid #1c2333",
                background: "rgba(21, 27, 38, 0.9)",
                fontSize: 28,
                fontWeight: 600,
                color: mode === "Sweep" ? "#e8ecf4" : "#8b95a8",
              }}
            >
              {mode}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 24, color: "#94a3b8", maxWidth: 640 }}>
            Borders · Landmarks · Hidden countries
          </div>
          <div style={{ fontSize: 22, color: "#475569" }}>dailyglobegames.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
