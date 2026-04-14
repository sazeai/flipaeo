import type React from "react"

interface YourWorkInSyncProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
  /** Theme palette */
  theme?: "light" | "dark"
}

/**
 * An Integrated System – Components working together seamlessly
 * Shows auth, payments, and database integration without the hell
 */
const YourWorkInSync: React.FC<YourWorkInSyncProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  const themeVars =
    theme === "light"
      ? {
          "--yws-surface": "#ffffff",
          "--yws-text-primary": "#37322f",
          "--yws-text-secondary": "#6b7280",
          "--yws-success": "#059669",
          "--yws-border": "rgba(0,0,0,0.08)",
          "--yws-shadow": "rgba(0,0,0,0.08)",
        }
      : ({
          "--yws-surface": "#1f2937",
          "--yws-text-primary": "#f9fafb",
          "--yws-text-secondary": "#d1d5db",
          "--yws-success": "#10b981",
          "--yws-border": "rgba(255,255,255,0.12)",
          "--yws-shadow": "rgba(0,0,0,0.24)",
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
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Integrated system showing auth, payments, and database working together"
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          height: "240px",
        }}
      >
        {/* Integration flow visualization */}
        <div style={{ width: "400px", height: "240px", position: "relative" }}>
          {/* Auth Component */}
          <div
            style={{
              position: "absolute",
              left: "0px",
              top: "20px",
              width: "110px",
              height: "60px",
              background: "var(--yws-surface)",
              border: "1px solid var(--yws-border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 1px 2px 0px var(--yws-shadow)",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>🔐</div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "var(--yws-text-primary)",
              }}
            >
              Auth
            </span>
          </div>

          {/* Database Component */}
          <div
            style={{
              position: "absolute",
              left: "0px",
              top: "100px",
              width: "110px",
              height: "60px",
              background: "var(--yws-surface)",
              border: "1px solid var(--yws-border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 1px 2px 0px var(--yws-shadow)",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>🗄️</div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "var(--yws-text-primary)",
              }}
            >
              Database
            </span>
          </div>

          {/* Payments Component */}
          <div
            style={{
              position: "absolute",
              left: "0px",
              top: "180px",
              width: "110px",
              height: "60px",
              background: "var(--yws-surface)",
              border: "1px solid var(--yws-border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 1px 2px 0px var(--yws-shadow)",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>💳</div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "var(--yws-text-primary)",
              }}
            >
              Payments
            </span>
          </div>

          {/* Connection lines */}
          <svg
            style={{
              position: "absolute",
              left: "110px",
              top: "0px",
              width: "180px",
              height: "260px",
              pointerEvents: "none",
            }}
            viewBox="0 0 180 260"
          >
            {/* Auth to center */}
            <path
              d="M 10 50 Q 90 50 90 130"
              stroke="var(--yws-success)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
            />
            {/* Database to center */}
            <path d="M 10 130 L 90 130" stroke="var(--yws-success)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
            {/* Payments to center */}
            <path
              d="M 10 210 Q 90 210 90 130"
              stroke="var(--yws-success)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4 4"
            />
            {/* Center to result */}
            <path d="M 90 130 L 170 130" stroke="var(--yws-success)" strokeWidth="2" fill="none" />
          </svg>

          {/* Integration Result */}
          <div
            style={{
              position: "absolute",
              right: "0px",
              top: "90px",
              width: "120px",
              height: "80px",
              background: "var(--yws-surface)",
              border: "2px solid var(--yws-success)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 2px 4px 0px var(--yws-shadow)",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>✨</div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--yws-success)",
                textAlign: "center",
                lineHeight: "1.3",
              }}
            >
              Cohesive
              <br />
              System
            </span>
          </div>

          {/* Bottom message */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "0px",
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "11px",
                color: "var(--yws-text-secondary)",
                letterSpacing: "-0.2px",
              }}
            >
              No integration hell. Everything works together.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YourWorkInSync
