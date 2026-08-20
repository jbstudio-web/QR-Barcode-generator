import { ImageResponse } from "next/og";

export const alt =
  "QR Atelier — design branded, scannable QR codes and barcodes right in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 7×7 decorative QR matrix: finder corners top-left, top-right, bottom-left.
const MATRIX = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 0, 1, 1],
  [0, 0, 1, 0, 1, 0, 0],
  [1, 1, 0, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0b0b10",
          color: "#f4f4f5",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            left: -140,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(99,102,241,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            right: -120,
            width: 680,
            height: 680,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(217,70,239,0.26) 0%, rgba(217,70,239,0) 70%)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 16,
                background: "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)",
              }}
            />
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.02 }}>QR Atelier</div>
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -0.03, lineHeight: 1.05 }}>
            Branded QR codes that still scan.
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 26,
              lineHeight: 1.5,
              color: "#a1a1aa",
            }}
          >
            Auto-branded from any URL, live-verified by a real decoder, exported as PNG or SVG.
            Barcodes too — all in your browser.
          </div>
          <div
            style={{
              marginTop: 34,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 19,
              fontWeight: 500,
              color: "#c7d2fe",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: "#34d399" }} />
            Free · no sign-up · nothing leaves your browser
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            width: 282,
            height: 282,
            padding: 24,
            marginLeft: "auto",
            alignSelf: "center",
            background: "#ffffff",
            borderRadius: 34,
          }}
        >
          {MATRIX.flatMap((row, r) =>
            row.map((on, c) =>
              on ? (
                <div
                  key={`${r}-${c}`}
                  style={{ width: 22, height: 22, borderRadius: 6, background: "#111114" }}
                />
              ) : null,
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}