import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "SVG Viewer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #fbf7ee 0%, #ece1cf 54%, #d9d0c4 100%)",
          color: "#111111",
          position: "relative",
          padding: "58px",
          fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 18%, rgba(20,70,232,0.15), transparent 28%), radial-gradient(circle at 86% 22%, rgba(106,225,45,0.2), transparent 22%), repeating-linear-gradient(90deg, transparent 0 28px, rgba(17,17,17,0.05) 28px 29px)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "3px solid rgba(17,17,17,0.92)",
            borderRadius: "34px",
            padding: "42px",
            boxShadow: "16px 16px 0 rgba(17,17,17,0.12)",
            background: "rgba(255,255,255,0.62)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "999px",
                  background: "#6ae12d",
                  border: "2px solid #111111",
                }}
              />
              Public SVG Viewer
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                padding: "12px 18px",
                borderRadius: "999px",
                border: "2px solid rgba(17,17,17,0.9)",
                background: "#1446e8",
                color: "#ffffff",
              }}
            >
              Viewer + Inspect + Export
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "820px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "84px",
                lineHeight: 0.92,
                fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
              }}
            >
              Safe image preview.
              <br />
              Worker-based analysis.
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "28px",
                color: "rgba(17,17,17,0.72)",
              }}
            >
              <span>Upload or paste raw SVG</span>
              <span>•</span>
              <span>Blob URL render</span>
              <span>•</span>
              <span>PNG export for self-contained assets</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            {["No upload", "URL fallback", "CORS-aware"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "14px 20px",
                  borderRadius: "18px",
                  border: "2px solid rgba(17,17,17,0.86)",
                  fontSize: "24px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.8)",
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
