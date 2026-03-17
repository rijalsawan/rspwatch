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
          background: "linear-gradient(160deg, #0d1526 0%, #080d1a 60%, #06091a 100%)",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 22,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow behind bell */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 100,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Bell */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: 18,
              height: 14,
              background: "linear-gradient(180deg, #bfdbfe 0%, #93c5fd 100%)",
              borderRadius: "6px 6px 0 0",
            }}
          />
          {/* Dome */}
          <div
            style={{
              width: 66,
              height: 42,
              background: "linear-gradient(165deg, #93c5fd 0%, #60a5fa 40%, #3b82f6 100%)",
              borderRadius: "38px 38px 0 0",
              boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
            }}
          />
          {/* Rim */}
          <div
            style={{
              width: 80,
              height: 13,
              background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
              borderRadius: "2px 2px 0 0",
            }}
          />
          {/* Clapper */}
          <div
            style={{
              width: 22,
              height: 14,
              background: "#60a5fa",
              borderRadius: "0 0 12px 12px",
              marginTop: 4,
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 1,
            background: "rgba(96,165,250,0.25)",
            marginTop: 18,
            marginBottom: 14,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              color: "#f1f5f9",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -1,
              fontFamily: "sans-serif",
              lineHeight: 1,
            }}
          >
            RSP
          </span>
          <span
            style={{
              color: "#60a5fa",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 6,
              fontFamily: "sans-serif",
              textTransform: "uppercase",
            }}
          >
            WATCH
          </span>
        </div>

        {/* Red badge (top-right corner) */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 18,
            height: 18,
            background: "#ef4444",
            borderRadius: "50%",
            border: "2.5px solid #080d1a",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
