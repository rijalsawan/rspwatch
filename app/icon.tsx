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
          background: "white",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          border: "2px solid black",
        }}
      >
        {/* Gavel/Hammer - Parliamentary symbol */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            width: 20,
            height: 20,
          }}
        >
          {/* Hammer head (horizontal bar) */}
          <div
            style={{
              width: 16,
              height: 4,
              background: "black",
              borderRadius: 2,
              marginBottom: 2,
            }}
          />

          {/* Hammer handle (vertical line) */}
          <div
            style={{
              width: 2,
              height: 10,
              background: "black",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
