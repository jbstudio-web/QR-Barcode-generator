import type {
  CornerDotStyle,
  CornerSquareStyle,
  DotStyle,
  EcLevel,
  GradientType,
  QrSettings,
  Shape,
} from "./types";

export const EC_OPTIONS: { value: EcLevel; label: string; title: string }[] = [
  { value: "L", label: "L", title: "7% damage recovery" },
  { value: "M", label: "M", title: "15% damage recovery" },
  { value: "Q", label: "Q", title: "25% damage recovery" },
  { value: "H", label: "H", title: "30% damage recovery — most resilient" },
];

export const DOT_STYLE_OPTIONS: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Pill" },
  { value: "dots", label: "Dots" },
  { value: "classy-rounded", label: "Classy" },
];

export const CORNER_SQUARE_OPTIONS: { value: CornerSquareStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Pill" },
];

export const CORNER_DOT_OPTIONS: { value: CornerDotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

export const GRADIENT_OPTIONS: { value: GradientType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
];

export const SHAPE_OPTIONS: { value: Shape; label: string; title: string }[] = [
  { value: "square", label: "Square", title: "Standard canvas" },
];

export const EXPORT_SIZES = [512, 1024, 2048, 4096];

export const EC_CAPACITY: Record<EcLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

/**
 * Translate the creativity slider (0 = Safe, 100 = Artistic) into concrete
 * QR style parameters. Colors and logo are intentionally left untouched —
 * those stay under the user's control.
 */
export function creativityToAuto(c: number): Partial<QrSettings> {
  const t1 = 18;
  const t2 = 42;
  const t3 = 66;
  const t4 = 84;

  const dotStyle: DotStyle =
    c < t1 ? "square" : c < t2 ? "rounded" : c < t3 ? "extra-rounded" : c < t4 ? "dots" : "classy-rounded";
  // Keep the finder-pattern corners recognizable as long as possible —
  // artistic corner styles are the fastest way to break a decode.
  const cornerSquareStyle: CornerSquareStyle =
    c < t2 ? "square" : c < 80 ? "dot" : "extra-rounded";
  const cornerDotStyle: CornerDotStyle = c < t2 ? "square" : "dot";
  const gradient: GradientType = c < t2 ? "none" : c < t4 ? "linear" : "radial";
  const gradientAngle = Math.min(135, Math.round(30 + (c - t2) * 1.6));
  const margin = Math.round(12 + (c / 100) * 10);
  const roundedBg = c < 30 ? 0 : Math.min(0.22, ((c - 30) / 100) * 0.22);
  const hideBackgroundDots = c < 84;
  // Note: qr-code-styling's "circle" shape crashes on some module counts, so
  // the canvas stays square. Rounded backgrounds + gradients carry the look.
  const shape: Shape = "square";

  return {
    dotStyle,
    cornerSquareStyle,
    cornerDotStyle,
    gradient,
    gradientAngle,
    margin,
    roundedBg,
    hideBackgroundDots,
    shape,
  };
}

export function creativityLabel(c: number): string {
  if (c < 18) return "Safe";
  if (c < 42) return "Polished";
  if (c < 66) return "Styled";
  if (c < 84) return "Artistic";
  return "Experimental";
}
