import type { Options } from "qr-code-styling";
import type { QrSettings } from "./types";

/**
 * Build qr-code-styling options for a given size. The data is passed
 * separately so the preview and export renders can share one settings object.
 *
 * Note: the library deep-merges new options over old ones and keeps any key
 * absent from the new object — so disabled features (gradients, logos) must
 * be passed as explicit `null` to actually turn off.
 */
export function buildQrOptions(s: QrSettings, size: number, data: string): Options {
  const gradient =
    s.gradient !== "none"
      ? {
          type: s.gradient as "linear" | "radial",
          rotation: (s.gradientAngle * Math.PI) / 180,
          colorStops: [
            { offset: 0, color: s.dotColor },
            { offset: 1, color: s.accentColor },
          ],
        }
      : null;

  const dotsOptions = {
    type: s.dotStyle,
    color: s.dotColor,
    roundSize: s.dotStyle === "square",
    gradient,
  };

  const backgroundOptions = {
    color: s.bgColor,
    round: s.roundedBg,
    gradient:
      s.bgStyle === "gradient"
        ? {
            type: "linear",
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: s.bgColor },
              { offset: 1, color: s.bgColor2 },
            ],
          }
        : null,
  };

  const cornersOptions = {
    color: s.dotColor,
    gradient,
  };

  const options = {
    width: size,
    height: size,
    type: "canvas",
    shape: s.shape,
    data,
    margin: s.margin,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: s.errorCorrection,
    },
    imageOptions: {
      saveAsBlob: true,
      hideBackgroundDots: s.hideBackgroundDots,
      imageSize: s.logoSize,
      crossOrigin: "anonymous",
      margin: s.logoMargin,
    },
    dotsOptions,
    backgroundOptions,
    cornersSquareOptions: {
      type: s.cornerSquareStyle,
      ...cornersOptions,
    },
    cornersDotOptions: {
      type: s.cornerDotStyle,
      ...cornersOptions,
    },
    image: s.logo,
  };

  return options as unknown as Options;
}
