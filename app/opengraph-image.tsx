import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "SVG Lab";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const Logo = () => (
  <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="oglg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00f0ff"/>
        <stop offset="100%" stopColor="#ff9f43"/>
      </linearGradient>
      <linearGradient id="oglg-fade" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25"/>
        <stop offset="100%" stopColor="#ff9f43" stopOpacity="0.12"/>
      </linearGradient>
    </defs>
    <path d="M16 2 4 9l12 7 12-7-12-7z" fill="url(#oglg-fade)" stroke="url(#oglg)" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M4 9v8l12 7V16L4 9z" fill="url(#oglg-fade)" stroke="url(#oglg)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7"/>
    <path d="M16 16v8l12-7V9l-12 7z" fill="url(#oglg-fade)" stroke="url(#oglg)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.45"/>
    <circle cx="16" cy="11" r="1.5" fill="url(#oglg)"/>
  </svg>
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#010104",
          position: "relative",
          padding: "60px",
          fontFamily: '"DM Mono", monospace',
          overflow: "hidden",
        }}
      >
        {/* Ambient glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,240,255,0.18), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,159,67,0.16), transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Main glass card */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: "28px",
            padding: "48px 52px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 60,
              right: 60,
              height: 2,
              background: "linear-gradient(90deg, transparent, #00f0ff, #ff9f43, transparent)",
              borderRadius: 1,
            }}
          />

          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Logo />
              <div
                style={{
                  fontFamily: '"Syne", sans-serif',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #f0f0f8, #00f0ff)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                SVG Lab
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(0,240,255,0.3)",
                background: "rgba(0,240,255,0.08)",
                color: "#00f0ff",
                letterSpacing: "0.04em",
              }}
            >
              Viewer + Inspect + Export
            </div>
          </div>

          {/* Main title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40, marginBottom: 40 }}>
            <div
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: "#f0f0f8",
              }}
            >
              Safe image preview.
            </div>
            <div
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                background: "linear-gradient(135deg, #00f0ff, #ff9f43)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Worker-based analysis.
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                fontSize: 20,
                color: "rgba(154,154,176,0.9)",
                marginTop: 8,
              }}
            >
              <span>Upload or paste raw SVG</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>Blob URL render</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>PNG export</span>
            </div>
          </div>

          {/* Bottom badges */}
          <div style={{ display: "flex", gap: 14 }}>
            {["No upload", "Privacy-first", "CORS-aware"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(240,240,248,0.85)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
