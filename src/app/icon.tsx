import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0369a1 100%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
