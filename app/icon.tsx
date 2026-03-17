import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#080d1a",
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "inset 0 0 0 1.5px rgba(96,165,250,0.35)",
        }}
      >
        {/* Bell shape */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            top: 6,
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: 4,
              height: 3,
              background: "#93c5fd",
              borderRadius: "3px 3px 0 0",
            }}
          />
          {/* Dome */}
          <div
            style={{
              width: 14,
              height: 9,
              background: "linear-gradient(170deg, #93c5fd 0%, #3b82f6 100%)",
              borderRadius: "8px 8px 0 0",
            }}
          />
          {/* Rim */}
          <div
            style={{
              width: 17,
              height: 3,
              background: "#3b82f6",
              borderRadius: "1px 1px 0 0",
            }}
          />
          {/* Clapper */}
          <div
            style={{
              width: 5,
              height: 3,
              background: "#60a5fa",
              borderRadius: "0 0 4px 4px",
              marginTop: 1,
            }}
          />
        </div>

        {/* Red notification badge */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            background: "#ef4444",
            borderRadius: "50%",
            border: "1.5px solid #080d1a",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
