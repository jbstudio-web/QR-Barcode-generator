"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Globe,
  ImageOff,
  Link2,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DEFAULT_SETTINGS, type BrandInfo, type QrSettings, type ScanCheckResult } from "@/lib/types";
import {
  CORNER_DOT_OPTIONS,
  CORNER_SQUARE_OPTIONS,
  DOT_STYLE_OPTIONS,
  EC_OPTIONS,
  GRADIENT_OPTIONS,
  SHAPE_OPTIONS,
  creativityLabel,
  creativityToAuto,
} from "@/lib/creativity";
import { buildBrandPalette, extractPalette, imageToDataUrl, loadImage } from "@/lib/color";
import { fetchBrand, proxyImageUrl } from "@/lib/metadata";
import { isValidHttpUrl, toQrData } from "@/lib/readability";
import { QrPreview } from "./qr-preview";
import { ColorField, RangeField, Section, Segmented, Toggle } from "./controls";

export default function QrStudio({
  initialUrl = "",
  resetToken = 0,
}: {
  initialUrl?: string;
  resetToken?: number;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [settings, setSettings] = useState<QrSettings>(DEFAULT_SETTINGS);
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [useBrandLogo, setUseBrandLogo] = useState(true);
  const [autoBrand, setAutoBrand] = useState(true);
  const [branding, setBranding] = useState<{
    analyzing: boolean;
    applied: boolean;
    error: string | null;
  }>({ analyzing: false, applied: false, error: null });
  const [scanResult, setScanResult] = useState<ScanCheckResult>({
    status: "idle",
    decoded: null,
    matches: null,
    score: 100,
  });
  const [faviconBroken, setFaviconBroken] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const lastAnalyzed = useRef("");
  const firstRunRef = useRef(true);

  const qrData = useMemo(() => toQrData(url), [url]);

  const set = useCallback(<K extends keyof QrSettings>(key: K, value: QrSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const analyze = useCallback(async (raw: string) => {
    const data = toQrData(raw);
    if (!data || !isValidHttpUrl(data)) return;
    lastAnalyzed.current = data;
    setBranding({ analyzing: true, applied: false, error: null });
    try {
      const info = await fetchBrand(data);
      if (!info) {
        setBranding({ analyzing: false, applied: false, error: "Couldn't fetch that site — it may block automated requests." });
        return;
      }
      setBrand(info);
      setFaviconBroken(false);

      let colors: string[] = [];
      let logo: string | null = null;
      if (info.favicon) {
        const proxied = proxyImageUrl(info.favicon);
        try {
          const img = await loadImage(proxied);
          colors = extractPalette(img);
          logo = await imageToDataUrl(proxied);
        } catch {
          /* favicon unusable — fall through to theme color */
        }
      }
      const pal = buildBrandPalette(colors, info.themeColor);
      setBrandColors(colors);
      setBrandLogo(logo);
      setUseBrandLogo(true);
      setSettings((s) => ({
        ...s,
        dotColor: pal.ink,
        accentColor: pal.accent,
        bgColor: pal.bg,
        bgColor2: pal.bg2,
        logo,
      }));
      setBranding({ analyzing: false, applied: true, error: null });
    } catch {
      setBranding({ analyzing: false, applied: false, error: "Something went wrong analyzing the site." });
    }
  }, []);

  // Auto-brand when a fresh valid URL is entered.
  useEffect(() => {
    if (!autoBrand) return;
    const data = toQrData(url);
    if (!data || !isValidHttpUrl(data) || lastAnalyzed.current === data) return;
    const t = setTimeout(() => {
      void analyze(data);
    }, 800);
    return () => clearTimeout(t);
  }, [url, autoBrand, analyze]);

  function applyCreativity(c: number) {
    setSettings((s) => ({ ...s, ...creativityToAuto(c), creativity: c }));
  }

  const clearBrand = useCallback(() => {
    setBrand(null);
    setBrandColors([]);
    setBrandLogo(null);
    setUseBrandLogo(false);
    setFaviconBroken(false);
    lastAnalyzed.current = "";
    setSettings((s) => ({
      ...s,
      dotColor: DEFAULT_SETTINGS.dotColor,
      accentColor: DEFAULT_SETTINGS.accentColor,
      bgColor: DEFAULT_SETTINGS.bgColor,
      bgColor2: DEFAULT_SETTINGS.bgColor2,
      logo: null,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setUrl("");
    setSettings(DEFAULT_SETTINGS);
    clearBrand();
    setScanResult({ status: "idle", decoded: null, matches: null, score: 100 });
  }, [clearBrand]);

  // Reset via the shared header button (skip the initial mount run so a
  // prefilled session isn't wiped).
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    resetAll();
  }, [resetToken, resetAll]);

  function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUseBrandLogo(false);
      setSettings((s) => ({ ...s, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  const thumbRing =
    scanResult.status === "pass"
      ? "#34d399"
      : scanResult.status === "fail"
        ? "#ef4444"
        : scanResult.status === "checking"
          ? "#fbbf24"
          : "#a78bfa";

  const brandSwatches = brandColors.length > 0 ? brandColors : undefined;

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ------- controls ------- */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1.5">
          {/* URL */}
          <Section title="Website" hint="auto-detect brand colors & logo">
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void analyze(url);
                }}
                placeholder="paste a website URL…"
                spellCheck={false}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 py-3 pl-10 pr-[86px] text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                disabled={branding.analyzing || !url}
                onClick={() => void analyze(url)}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:opacity-90 disabled:opacity-40"
              >
                {branding.analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Brand it
              </button>
            </div>

            <div className="space-y-3">
              <Toggle
                label="Auto-brand new URLs"
                description="Analyze each pasted URL automatically"
                checked={autoBrand}
                onChange={setAutoBrand}
              />

              <AnimatePresence initial={false}>
                {brand && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                          {brand.favicon && !faviconBroken ? (
                            <img
                              src={proxyImageUrl(brand.favicon)}
                              alt=""
                              className="h-7 w-7 object-contain"
                              onError={() => setFaviconBroken(true)}
                            />
                          ) : (
                            <Globe className="h-4 w-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-200">
                            {brand.title || brand.domain}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {brand.domain}
                            {brand.themeColor && (
                              <span className="ml-2 inline-flex items-center gap-1">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                                  style={{ background: brand.themeColor }}
                                />
                                theme
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearBrand}
                          title="Remove brand palette"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {brandSwatches && brandSwatches.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          {brandSwatches.slice(0, 6).map((c, i) => (
                            <span
                              key={i}
                              className="h-5 w-5 rounded-md border border-white/10"
                              style={{ background: c }}
                              title={c}
                            />
                          ))}
                          <span className="ml-1 text-[10px] text-zinc-600">
                            {branding.applied ? "applied to QR" : "detected"}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {branding.error && (
                <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <ImageOff className="h-3.5 w-3.5 shrink-0" />
                  {branding.error}
                </p>
              )}
            </div>
          </Section>

          {/* Creativity */}
          <Section
            title="Creativity"
            hint="the QR keeps checking itself"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Creativity ↔ Scanability</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: thumbRing }}
                  />
                  <span className="font-mono text-[11px] text-zinc-500">
                    {settings.creativity}%
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-fuchsia-500 opacity-80" />
                <input
                  type="range"
                  className="creativity-range relative"
                  min={0}
                  max={100}
                  value={settings.creativity}
                  onChange={(e) => applyCreativity(Number(e.target.value))}
                  style={{ "--thumb-ring": thumbRing } as CSSProperties}
                  aria-label="Creativity versus scanability"
                />
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                <span>Safe</span>
                <span className="text-zinc-400">{creativityLabel(settings.creativity)}</span>
                <span>Artistic</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-400" />
                Adjusts module shape, corners, gradients, spacing & shape — and
                live-checks that it still decodes.
              </p>
            </div>
          </Section>

          {/* Style */}
          <Section title="Style">
            <div className="space-y-1.5">
              <p className="pb-1 text-xs text-zinc-400">Module shape</p>
              <Segmented
                value={settings.dotStyle}
                onChange={(v) => set("dotStyle", v)}
                options={DOT_STYLE_OPTIONS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Corners</p>
                <Segmented
                  value={settings.cornerSquareStyle}
                  onChange={(v) => set("cornerSquareStyle", v)}
                  options={CORNER_SQUARE_OPTIONS}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Corner dots</p>
                <Segmented
                  value={settings.cornerDotStyle}
                  onChange={(v) => set("cornerDotStyle", v)}
                  options={CORNER_DOT_OPTIONS}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Shape</p>
                <Segmented
                  value={settings.shape}
                  onChange={(v) => set("shape", v)}
                  options={SHAPE_OPTIONS}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Error correction</p>
                <Segmented
                  value={settings.errorCorrection}
                  onChange={(v) => set("errorCorrection", v)}
                  options={EC_OPTIONS}
                />
              </div>
            </div>
            <RangeField
              label="Margin"
              value={settings.margin}
              min={0}
              max={60}
              onChange={(v) => set("margin", v)}
              format={(v) => `${v}px`}
            />
          </Section>

          {/* Colors */}
          <Section title="Colors">
            <ColorField
              label="Modules (ink)"
              value={settings.dotColor}
              onChange={(v) => set("dotColor", v)}
              swatches={brandSwatches}
            />
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-400">Gradient</p>
              <Segmented
                value={settings.gradient}
                onChange={(v) => set("gradient", v)}
                options={GRADIENT_OPTIONS}
              />
            </div>
            {settings.gradient !== "none" && (
              <>
                <ColorField
                  label="Gradient end"
                  value={settings.accentColor}
                  onChange={(v) => set("accentColor", v)}
                  swatches={brandSwatches}
                />
                {settings.gradient === "linear" && (
                  <RangeField
                    label="Gradient angle"
                    value={settings.gradientAngle}
                    min={0}
                    max={180}
                    onChange={(v) => set("gradientAngle", v)}
                    format={(v) => `${v}°`}
                  />
                )}
              </>
            )}
            <div className="border-t border-zinc-800/60 pt-3">
              <ColorField
                label="Background"
                value={settings.bgColor}
                onChange={(v) => set("bgColor", v)}
                swatches={brandSwatches}
              />
              <div className="pt-2">
                <Toggle
                  label="Background gradient"
                  checked={settings.bgStyle === "gradient"}
                  onChange={(v) => set("bgStyle", v ? "gradient" : "solid")}
                />
              </div>
              {settings.bgStyle === "gradient" && (
                <div className="pt-2">
                  <ColorField
                    label="Background end"
                    value={settings.bgColor2}
                    onChange={(v) => set("bgColor2", v)}
                  />
                </div>
              )}
              <div className="pt-2">
                <RangeField
                  label="Rounded background"
                  value={Math.round(settings.roundedBg * 100)}
                  min={0}
                  max={50}
                  onChange={(v) => set("roundedBg", v / 100)}
                  format={(v) => `${v}%`}
                />
              </div>
            </div>
          </Section>

          {/* Logo */}
          <Section title="Logo">
            {brandLogo && (
              <Toggle
                label="Use site logo"
                description="Brand favicon in the center"
                checked={useBrandLogo}
                onChange={(v) => {
                  setUseBrandLogo(v);
                  setSettings((s) => ({ ...s, logo: v ? brandLogo : null }));
                }}
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Upload image…
              </button>
              {settings.logo && (
                <button
                  type="button"
                  onClick={() => {
                    setUseBrandLogo(false);
                    setSettings((s) => ({ ...s, logo: null }));
                  }}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 transition hover:border-red-500/40 hover:text-red-300"
                >
                  Remove
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onLogoUpload}
              />
            </div>
            <RangeField
              label="Logo size"
              value={Math.round(settings.logoSize * 100)}
              min={10}
              max={45}
              onChange={(v) => set("logoSize", v / 100)}
              format={(v) => `${v}%`}
            />
            <RangeField
              label="Logo margin"
              value={settings.logoMargin}
              min={0}
              max={20}
              onChange={(v) => set("logoMargin", v)}
              format={(v) => `${v}px`}
            />
            {settings.logo && (
              <Toggle
                label="Hide dots behind logo"
                description="Cleaner center, slightly fewer hidden modules"
                checked={settings.hideBackgroundDots}
                onChange={(v) => set("hideBackgroundDots", v)}
              />
            )}
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Big logos hide more modules. The scanability meter reflects it in
              real time.
            </p>
          </Section>

          <p className="px-1 pb-2 text-center text-[10px] leading-relaxed text-zinc-700">
            Runs entirely in your browser — qr-code-styling · jsQR · html5-qrcode
          </p>
        </aside>

        {/* ------- preview ------- */}
        <section className="lg:sticky lg:top-4 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1.5">
          <QrPreview
            settings={settings}
            data={qrData}
            scanResult={scanResult}
            onScanCheck={setScanResult}
            onExportSizeChange={(v) => set("exportSize", v)}
          />
        </section>
      </main>
    </div>
  );
}
