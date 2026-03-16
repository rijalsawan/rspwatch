import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "RSP Watch — Nepal's Parliamentary Accountability Tracker"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 80px",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Logo + Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: 30, fontWeight: 900, lineHeight: 1 }}>W</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
                RSP Watch
              </span>
              <span style={{ color: "#64748b", fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>
                rspwatch.np
              </span>
            </div>

            {/* Live badge */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(22,163,74,0.12)",
                border: "1px solid rgba(22,163,74,0.3)",
                borderRadius: 999,
                padding: "6px 14px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "flex",
                }}
              />
              <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>LIVE</span>
            </div>
          </div>

          {/* Middle: Main headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1
              style={{
                color: "#f1f5f9",
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2.5,
                margin: 0,
              }}
            >
              Nepal&apos;s Parliament,
              <br />
              <span style={{ color: "#60a5fa" }}>Held Accountable.</span>
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 26,
                lineHeight: 1.4,
                margin: 0,
                maxWidth: 700,
              }}
            >
              Tracking RSP&apos;s promises, laws, and votes — in real time.
            </p>
          </div>

          {/* Bottom: Stats strip */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 28,
              gap: 0,
            }}
          >
            {[
              { value: "34", label: "MPs Tracked" },
              { value: "15", label: "Promises" },
              { value: "5", label: "Laws Filed" },
              { value: "4", label: "Votes Recorded" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  flex: 1,
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  paddingLeft: i > 0 ? 40 : 0,
                }}
              >
                <span style={{ color: "#f1f5f9", fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
                  {stat.value}
                </span>
                <span style={{ color: "#64748b", fontSize: 16 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
