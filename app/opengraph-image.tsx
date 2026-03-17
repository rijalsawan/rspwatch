import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Parliament Watch — Nepal's Parliamentary Accountability Tracker"
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
          background: "#070c18",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background: subtle diagonal lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(120deg, rgba(59,130,246,0.03) 0px, rgba(59,130,246,0.03) 1px, transparent 1px, transparent 60px)",
            display: "flex",
          }}
        />

        {/* Background orbs */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -80,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            right: 280,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            width: 580,
            display: "flex",
            flexDirection: "column",
            padding: "60px 50px 60px 64px",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Mini bell icon */}
            <div
              style={{
                width: 46,
                height: 46,
                background: "linear-gradient(145deg, #1e3a6e, #1d4ed8)",
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                position: "relative",
                boxShadow: "0 0 0 1px rgba(96,165,250,0.3), 0 4px 16px rgba(29,78,216,0.4)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 5, height: 4, background: "#bfdbfe", borderRadius: "3px 3px 0 0" }} />
                <div style={{ width: 20, height: 13, background: "#93c5fd", borderRadius: "10px 10px 0 0" }} />
                <div style={{ width: 25, height: 4, background: "#60a5fa" }} />
                <div style={{ width: 7, height: 4, background: "#93c5fd", borderRadius: "0 0 4px 4px", marginTop: 1 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 9,
                  height: 9,
                  background: "#ef4444",
                  borderRadius: "50%",
                  border: "1.5px solid #1e3a6e",
                  display: "flex",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
                Parliament Watch
              </span>
              <span style={{ color: "#3b82f6", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
                parliamentwatch.np
              </span>
            </div>

            {/* LIVE badge */}
            <div
              style={{
                marginLeft: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(22,163,74,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 999,
                padding: "5px 12px",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "flex",
                }}
              />
              <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>LIVE</span>
            </div>
          </div>

          {/* Main headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 48,
                height: 3,
                background: "linear-gradient(90deg, #3b82f6, #818cf8)",
                borderRadius: 2,
                marginBottom: 4,
              }}
            />
            <h1
              style={{
                color: "#f1f5f9",
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: -2,
                margin: 0,
              }}
            >
              Nepal&apos;s Parliament,
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #60a5fa, #818cf8)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Held Accountable.
              </span>
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: 20,
                lineHeight: 1.5,
                margin: 0,
                maxWidth: 440,
              }}
            >
              Tracking all parliamentary parties, votes &amp; laws — transparently.
            </p>
          </div>

          {/* Bottom stats */}
          <div style={{ display: "flex", gap: 32 }}>
            {[
              { n: "34", label: "MPs" },
              { n: "15", label: "Promises" },
              { n: "5", label: "Laws" },
              { n: "4", label: "Votes" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "#60a5fa", fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
                  {s.n}
                </span>
                <span style={{ color: "#475569", fontSize: 13, fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── VERTICAL DIVIDER ── */}
        <div
          style={{
            width: 1,
            background: "linear-gradient(180deg, transparent, rgba(59,130,246,0.2) 30%, rgba(59,130,246,0.2) 70%, transparent)",
            display: "flex",
          }}
        />

        {/* ── RIGHT COLUMN — Dashboard cards ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "52px 60px 52px 44px",
            gap: 14,
            justifyContent: "center",
          }}
        >
          {/* Card 1: Parliament Status */}
          <div
            style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(59,130,246,0.18)",
              borderRadius: 14,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Active MPs
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 6,
                  padding: "3px 10px",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "flex" }} />
                <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>Session Live</span>
              </div>
            </div>
            <span style={{ color: "#f1f5f9", fontSize: 38, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>
              34 <span style={{ color: "#475569", fontSize: 16, fontWeight: 500, letterSpacing: 0 }}>of 40 seats</span>
            </span>
            {/* Progress bar */}
            <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, display: "flex" }}>
              <div
                style={{
                  width: "85%",
                  height: 6,
                  background: "linear-gradient(90deg, #3b82f6, #818cf8)",
                  borderRadius: 99,
                  display: "flex",
                }}
              />
            </div>
          </div>

          {/* Card 2: Latest Vote */}
          <div
            style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(59,130,246,0.18)",
              borderRadius: 14,
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Latest Vote
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0 }}>
              <span style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600, lineHeight: 1.3, maxWidth: 240 }}>
                Education Reform Bill
              </span>
              <div
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  display: "flex",
                }}
              >
                <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>PASSED</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <span style={{ color: "#4ade80", fontSize: 13 }}>28 For</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>·</span>
              <span style={{ color: "#f87171", fontSize: 13 }}>6 Against</span>
            </div>
          </div>

          {/* Card 3: Promises */}
          <div
            style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(59,130,246,0.18)",
              borderRadius: 14,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Promise Tracker
              </span>
              <span style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>15 Active</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { count: "8", label: "Kept", color: "#22c55e" },
                { count: "5", label: "Pending", color: "#f59e0b" },
                { count: "2", label: "Broken", color: "#ef4444" },
              ].map((p) => (
                <div
                  key={p.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <span style={{ color: p.color, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{p.count}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
