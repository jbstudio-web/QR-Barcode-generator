"use client";

import { useEffect, useState } from "react";

const KEY = "qra-consent";

/**
 * Google Consent Mode v2 gate. Ads default to denied everywhere; this only
 * ever upgrades to granted on an explicit click.
 * ponytail: self-hosted banner, not a certified CMP. AdSense in the EEA
 * technically requires a Google-certified CMP — swap this for one before
 * serving EEA traffic at scale.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function setConsent(granted: boolean) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — stay silent rather than nag every render */
    }
  }, []);

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(KEY, granted ? "granted" : "denied");
    } catch {
      /* ignore */
    }
    setConsent(granted);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <p className="max-w-[640px] text-[11px] leading-relaxed text-zinc-400">
          We use cookies to serve ads. Personalized ads are off until you accept.
          Your QR designs never leave your browser either way — see the{" "}
          <a href="/privacy" className="text-indigo-300 underline underline-offset-2">
            privacy policy
          </a>
          .
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
