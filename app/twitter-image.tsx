import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Parliament Watch - Transparent Data of Nepal's Parliament"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            padding: "60px 80px",
            borderRadius: 40,
            border: "2px solid #1e293b",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="140"
            height="140"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: 40 }}
          >
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <h1
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Parliament Watch
          </h1>
          <p
            style={{
              fontSize: 36,
              color: "#94a3b8",
              margin: 0,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            Transparent, accessible data tracking Nepal's parliament and representatives.
          </p>
        </div>
      </div>
    ),
    { ...size }
  )
}
