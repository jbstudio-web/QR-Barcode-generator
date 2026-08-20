"use client";

import { createContext, useContext, useEffect, useRef } from "react";

export interface AdConfig {
  client: string;
  banner: string;
  sidebar: string;
  footer: string;
}

const EMPTY: AdConfig = { client: "", banner: "", sidebar: "", footer: "" };

/**
 * Ad IDs are read from env in the server layout and handed down, so the vars
 * need no NEXT_PUBLIC_ prefix. The values still end up in the HTML (AdSense
 * requires that) — this only changes where they are sourced.
 */
const AdConfigContext = createContext<AdConfig>(EMPTY);

export function AdConfigProvider({
  value,
  children,
}: {
  value: AdConfig;
  children: React.ReactNode;
}) {
  return <AdConfigContext.Provider value={value}>{children}</AdConfigContext.Provider>;
}

type AdFormat = "horizontal" | "vertical";

interface AdSlotProps {
  slot: "banner" | "sidebar" | "footer";
  format?: AdFormat;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slot, format = "horizontal", className = "" }: AdSlotProps) {
  const pushedRef = useRef(false);
  const cfg = useContext(AdConfigContext);
  const AD_CLIENT = cfg.client;
  const slotId = cfg[slot];
  const enabled = Boolean(AD_CLIENT && slotId);

  useEffect(() => {
    if (!enabled || pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ad blocked or script not ready — the slot stays empty */
    }
  }, [enabled]);

  if (!enabled) {
    return (
      <div
        className={`${
          format === "vertical"
            ? "min-h-[250px] w-full max-w-[300px]"
            : "min-h-[90px] w-full"
        } ${className} flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center`}
        aria-hidden
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          Advertisement
        </span>
        <span className="text-[10px] text-zinc-700">
          ad slot · {slot}
          {AD_CLIENT && !slotId ? " · set slot ID in env" : " · configure in env"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${
        format === "vertical" ? "min-h-[250px] w-full max-w-[300px]" : "min-h-[90px] w-full"
      } ${className} flex items-center justify-center`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}