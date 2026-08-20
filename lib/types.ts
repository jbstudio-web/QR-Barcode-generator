export type DotStyle =
  | "square"
  | "rounded"
  | "extra-rounded"
  | "dots"
  | "classy"
  | "classy-rounded";
export type CornerSquareStyle = "square" | "dot" | "extra-rounded";
export type CornerDotStyle = "square" | "dot";
export type GradientType = "none" | "linear" | "radial";
export type BgStyle = "solid" | "gradient";
export type Shape = "square" | "circle";
export type EcLevel = "L" | "M" | "Q" | "H";

export interface QrSettings {
  exportSize: number;
  margin: number;
  errorCorrection: EcLevel;
  shape: Shape;
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  gradient: GradientType;
  gradientAngle: number;
  dotColor: string;
  accentColor: string;
  bgStyle: BgStyle;
  bgColor: string;
  bgColor2: string;
  roundedBg: number;
  logo: string | null;
  logoSize: number;
  logoMargin: number;
  hideBackgroundDots: boolean;
  creativity: number;
}

export const DEFAULT_SETTINGS: QrSettings = {
  exportSize: 1024,
  margin: 16,
  errorCorrection: "H",
  shape: "square",
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerDotStyle: "square",
  gradient: "none",
  gradientAngle: 45,
  dotColor: "#111827",
  accentColor: "#6366f1",
  bgStyle: "solid",
  bgColor: "#ffffff",
  bgColor2: "#eef2ff",
  roundedBg: 0,
  logo: null,
  logoSize: 0.26,
  logoMargin: 0,
  hideBackgroundDots: true,
  creativity: 35,
};

export interface BrandInfo {
  title: string | null;
  description: string | null;
  url: string;
  domain: string;
  favicon: string | null;
  appleTouchIcon: string | null;
  ogImage: string | null;
  themeColor: string | null;
}

export interface BrandPalette {
  ink: string;
  accent: string;
  bg: string;
  bg2: string;
  colors: string[];
  fromThemeColor: boolean;
}

export type ScanCheckStatus = "idle" | "checking" | "pass" | "fail";

export interface ScanCheckResult {
  status: ScanCheckStatus;
  decoded: string | null;
  matches: boolean | null;
  /** 0–100 heuristic confidence, blended with the emulated decode result */
  score: number;
}

export type ScanOutcome = "scanning" | "pass" | "mismatch" | "fail" | "error";

export interface ScanTestResult {
  outcome: ScanOutcome;
  decoded: string | null;
  message: string | null;
}
