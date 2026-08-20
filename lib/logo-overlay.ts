import { EC_CAPACITY } from "./creativity";
import type { QrSettings } from "./types";

export interface LogoBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute where the center logo goes, mirroring qr-code-styling's
 * computeHide() so the drawn logo lines up with the region whose dots the
 * library hides behind it.
 */
export function computeLogoBox(
  moduleCount: number,
  size: number,
  settings: QrSettings,
  imageWidth: number,
  imageHeight: number,
): LogoBox {
  const drawing = size - 2 * settings.margin;
  const dotSize = drawing / moduleCount;
  const maxHiddenDots =
    settings.logoSize * EC_CAPACITY[settings.errorCorrection] * moduleCount * moduleCount;
  const maxHiddenAxisDots = moduleCount - 14;
  const aspect = imageWidth / imageHeight;

  let hideX = Math.floor(Math.sqrt(maxHiddenDots / aspect));
  if (hideX <= 0) hideX = 1;
  if (maxHiddenAxisDots && hideX > maxHiddenAxisDots) hideX = maxHiddenAxisDots;
  if (hideX % 2 === 0) hideX--;
  let hiddenW = hideX * dotSize;
  let hideY = 1 + 2 * Math.ceil((hideX * aspect - 1) / 2);
  let hiddenH = Math.round(hiddenW * aspect);

  if (hideY * hideX > maxHiddenDots || (maxHiddenAxisDots && maxHiddenAxisDots < hideY)) {
    if (maxHiddenAxisDots && maxHiddenAxisDots < hideY) {
      hideY = maxHiddenAxisDots;
      if (hideY % 2 === 0) hideX--;
      hiddenH = hideY * dotSize;
      hideX = 1 + 2 * Math.ceil((hideY / aspect - 1) / 2);
      hiddenW = Math.round(hiddenH / aspect);
    } else {
      hideY -= 2;
      hiddenH = hideY * dotSize;
      hideX = 1 + 2 * Math.ceil((hideY / aspect - 1) / 2);
      hiddenW = Math.round(hiddenH / aspect);
    }
  }

  const margin = settings.logoMargin;
  const boxW = Math.max(0, hiddenW - 2 * margin);
  const boxH = Math.max(0, hiddenH - 2 * margin);
  return { x: (size - boxW) / 2, y: (size - boxH) / 2, width: boxW, height: boxH };
}

/**
 * qr-code-styling's SVG→canvas pass races the embedded logo image, so the
 * logo can silently vanish. This draws it onto the canvas directly — the
 * deterministic, always-visible path. It also runs on export canvases.
 */
export function drawLogoOverlay(
  canvas: HTMLCanvasElement,
  moduleCount: number,
  settings: QrSettings,
  logoImg: HTMLImageElement,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const iw = logoImg.naturalWidth || 1;
  const ih = logoImg.naturalHeight || 1;
  const box = computeLogoBox(moduleCount, canvas.width, settings, iw, ih);

  // The library's dot-hiding can silently fail (it races the logo decode),
  // so when hideBackgroundDots is on, paint the background plate ourselves
  // so the logo always sits on a clean, high-contrast backdrop.
  if (settings.hideBackgroundDots) {
    ctx.fillStyle = settings.bgColor;
    const r = Math.min(14, box.width * 0.12);
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.width, box.height, r);
    ctx.fill();
  }

  // Contain the image within the box, preserving its aspect ratio.
  const scale = Math.min(box.width / iw, box.height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(logoImg, box.x + (box.width - dw) / 2, box.y + (box.height - dh) / 2, dw, dh);
}
