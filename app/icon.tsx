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
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: -1,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  )
}
