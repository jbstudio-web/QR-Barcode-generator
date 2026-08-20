import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            width: 128,
            height: 128,
            padding: 6,
            background: "#ffffff",
            borderRadius: 22,
          }}
        >
          {MATRIX.flatMap((row, r) =>
            row.map((on, c) =>
              on ? (
                <div
                  key={`${r}-${c}`}
                  style={{ width: 13, height: 13, borderRadius: 3, background: "#111114" }}
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