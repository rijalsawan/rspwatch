import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(145deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {/* W monogram */}
        <span
          style={{
            color: "white",
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: -4,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          W
        </span>
        {/* Sub-label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 5,
              fontFamily: "sans-serif",
              textTransform: "uppercase",
            }}
          >
            RSP WATCH
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
