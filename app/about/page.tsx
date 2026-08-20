import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & Contact — QR Atelier",
  description:
    "What QR Atelier is, who builds it, how the scanability engine works, and how to get in touch.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About & Contact — QR Atelier",
    description:
      "What QR Atelier is, who builds it, how the scanability engine works, and how to get in touch.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
};

export default function About() {
  return (
    <LegalPage title="About QR Atelier" updated="August 20, 2026">
      <h2>What this is</h2>
      <p>
        QR Atelier is a browser-based design lab for QR codes and
        standards-compliant 1D barcodes. Most QR generators give you a black
        square and a download button. The interesting problem is not generating a
        QR code — it is generating a <em>beautiful</em> one that still scans, and
        knowing where that line sits.
      </p>

      <h2>The scanability problem</h2>
      <p>
        Every aesthetic choice in a QR code costs you error-correction budget.
        Rounded modules erode the contrast at module edges. A logo punches a hole
        in the data region. A low-contrast brand gradient can push the luminance
        difference below what a phone camera resolves in poor light.
      </p>
      <p>
        So the creativity slider is paired with a live decode check: as you push
        toward the artistic end, the app repeatedly re-decodes its own output and
        reports whether the code still reads. You are not guessing whether the
        design survived — you are watching it get tested.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Auto-branding</strong> reads a URL&rsquo;s title, theme color, and
          icon, then derives a palette that keeps enough contrast to decode.
        </li>
        <li>
          <strong>Rendering</strong> happens on canvas in your browser, so
          exports are resolution-independent up to 2K, in PNG or SVG.
        </li>
        <li>
          <strong>Barcodes</strong> are generated to spec — EAN, UPC, Code 128,
          and friends — with checksum validation rather than best-effort drawing.
        </li>
        <li>
          <strong>Verification</strong> uses a real decoder on the rendered
          output, plus an optional camera test against your physical screen.
        </li>
      </ul>

      <h2>Privacy in one line</h2>
      <p>
        Everything renders locally; nothing you design is uploaded. The details
        are in the <a href="/privacy">privacy policy</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Bug reports, feature requests, or questions:{" "}
        <a href="mailto:etsygurruofficetool@gmail.com">
          etsygurruofficetool@gmail.com
        </a>
        . I read everything, and a reproducible bug report is the fastest way to
        get something fixed.
      </p>
    </LegalPage>
  );
}
