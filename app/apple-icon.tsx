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
          background: "white",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Outer circle border */}
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "8px solid black",
            display: "flex",
          }}
        />

        {/* Gavel/Hammer - Parliamentary symbol */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Hammer head (horizontal bar) */}
          <div
            style={{
              width: 60,
              height: 16,
              background: "black",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />

          {/* Hammer handle (vertical line) */}
          <div
            style={{
              width: 8,
              height: 50,
              background: "black",
              borderRadius: 4,
            }}
          />
        </div>

        {/* Wordmark - bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span
            style={{
              color: "black",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: -0.5,
              fontFamily: "sans-serif",
              lineHeight: 1,
            }}
          >
            Parliament
          </span>
          <span
            style={{
              color: "black",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: "sans-serif",
              textTransform: "uppercase",
            }}
          >
            Watch
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
