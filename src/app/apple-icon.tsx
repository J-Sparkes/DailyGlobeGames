import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06080c",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0369a1 100%)",
            boxShadow: "0 0 40px rgba(56, 189, 248, 0.35)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
