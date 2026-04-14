import type React from "react"

interface BuyBackWeekendProps {
  width?: number | string
  height?: number | string
  className?: string
  theme?: "light" | "dark"
}

/**
 * Buy Back Your Weekend - Time-saving visualization
 * Shows the contrast between tedious setup vs instant productivity
 */
const BuyBackWeekend: React.FC<BuyBackWeekendProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  const themeVars =
    theme === "light"
      ? {
          "--bbw-surface": "#ffffff",
          "--bbw-text": "#1b1919",
          "--bbw-border": "rgba(0,0,0,0.08)",
          "--bbw-shadow": "rgba(0,0,0,0.12)",
        }
      : ({
          "--bbw-surface": "#333937",
          "--bbw-text": "#f8f8f8",
          "--bbw-border": "rgba(255,255,255,0.16)",
          "--bbw-shadow": "rgba(0,0,0,0.28)",
        } as React.CSSProperties)

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: "relative",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Time comparison showing weekend saved with clean foundation"
    >
      <div
        style={{
          position: "relative",
          width: "400px",
          height: "240px",
        }}
      >
        {/* Left card - Traditional Setup (Tedious) */}
        <div style={{ position: "absolute", left: "0px", top: "20px", width: "180px" }}>
          <div style={{ transform: "rotate(-3deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "180px",
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#dc2626",
                    marginBottom: "4px",
                  }}
                >
                  Traditional Setup
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "9px",
                    color: "#6b7280",
                  }}
                >
                  Your entire weekend
                </div>
              </div>

              {/* Time blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    background: "rgba(220,38,38,0.05)",
                    borderRadius: "6px",
                    padding: "8px",
                    borderLeft: "3px solid #dc2626",
                  }}
                >
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "8px", color: "#dc2626" }}>
                    Saturday: Auth Setup
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "7px", color: "#6b7280" }}>
                    8 hours debugging
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(220,38,38,0.05)",
                    borderRadius: "6px",
                    padding: "8px",
                    borderLeft: "3px solid #dc2626",
                  }}
                >
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "8px", color: "#dc2626" }}>
                    Sunday: Database
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "7px", color: "#6b7280" }}>
                    6 hours configuration
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(220,38,38,0.05)",
                    borderRadius: "6px",
                    padding: "8px",
                    borderLeft: "3px solid #dc2626",
                  }}
                >
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "8px", color: "#dc2626" }}>
                    Monday: Still Setup
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "7px", color: "#6b7280" }}>
                    Code janitor work
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card - Unboilerplate (Clean Foundation) */}
        <div style={{ position: "absolute", right: "0px", top: "0px", width: "180px" }}>
          <div style={{ transform: "rotate(2deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "180px",
                background: "#ffffff",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#1f2937",
                    marginBottom: "4px",
                  }}
                >
                  Unboilerplate
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "9px",
                    color: "#6b7280",
                  }}
                >
                  3 minutes to features
                </div>
              </div>

              {/* Quick setup */}
              <div
                style={{
                  background: "rgba(31,41,55,0.05)",
                  borderRadius: "6px",
                  padding: "12px",
                  borderLeft: "3px solid #1f2937",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "8px", color: "#1f2937" }}>
                  ✓ Deploy & Setup
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "7px", color: "#6b7280" }}>
                  3 minutes total
                </div>
              </div>

              {/* Weekend activities */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    background: "rgba(31,41,55,0.05)",
                    borderRadius: "4px",
                    padding: "6px",
                    borderLeft: "2px solid #1f2937",
                  }}
                >
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "7px", color: "#1f2937" }}>
                    Saturday: Build Features
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(31,41,55,0.05)",
                    borderRadius: "4px",
                    padding: "6px",
                    borderLeft: "2px solid #1f2937",
                  }}
                >
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "7px", color: "#1f2937" }}>
                    Sunday: Enjoy Weekend
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow pointing from left to right */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
              border: "2px solid #1f2937",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyBackWeekend
