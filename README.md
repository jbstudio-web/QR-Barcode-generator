# QR Atelier

A browser-based design lab for creating branded, scannable QR codes and standards-compliant 1D barcodes. Paste a URL and the app auto-detects brand colors, logo, and theme — then lets you fine-tune every visual detail while continuously verifying that the code still decodes.

**Everything runs in your browser.** No accounts, no uploads, no server-side rendering of codes.

<p align="center"><img src="transform this image into anime style.jpg" alt="Junaid Bhatti banner" width="300%" /></p>

## Features

### QR Code Studio

- **Auto-branding** — paste any URL and the app fetches the site's favicon, theme color, and extracts a full color palette. One click applies it to your QR.
- **Creativity slider** — drag from *Safe* to *Experimental* and watch the app automatically adjust module shapes, corner styles, gradients, spacing, and background rounding while live-checking that the code still decodes.
- **Full style control** — module shape (square, rounded, pill, dots, classy), corner square/dot styles, linear & radial gradients, background color/gradient, rounded background, margin, error correction level (L/M/Q/H).
- **Logo overlay** — upload any image or use the auto-detected favicon. Controls for size, margin, and whether to hide dots behind the logo. The scanability gauge reflects the impact in real time.
- **Live scanability check** — the generated QR is decoded in-browser with both `jsQR` and `@zxing/library` (the same decoder family phones use). A pass/fail badge and heuristic score update as you tweak settings.
- **Camera & file scanner** — verify the QR with a real scan using your device camera or by uploading a screenshot.
- **Export** — download as PNG (512/1024/2048 px) or SVG, or copy directly to clipboard.

### Barcode Studio

- **7 formats** — Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14. Each shows its character rules and a placeholder.
- **Style controls** — bar color, background color, bar height, resolution (1–4×), quiet zone, text toggle with size control.
- **Live verification** — every render is decoded back with `@zxing/library` to confirm it's scannable. A progress bar and decoded text are shown.
- **Export** — PNG, SVG, or copy to clipboard.

### Under the Hood

- **Server proxy routes** — `/api/metadata` fetches and parses a target site's HTML to extract title, description, favicon, theme color, and OG image. `/api/favicon` proxies images through the same origin to avoid canvas tainting. Both enforce SSRF protections (no localhost, no private IPs).
- **Palette extraction** — dominant colors are extracted from favicons via downscaling + color bucketing, then turned into a scannable brand palette (dark ink, saturated accent, light background) with WCAG contrast guarantees.
- **Heuristic scoring** — beyond the decode check, a confidence score accounts for contrast ratios, gradient risk, dot style risk, and logo coverage vs. error correction capacity.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Animations | Motion (Framer Motion successor) |
| QR rendering | qr-code-styling |
| QR decoding | jsQR, @zxing/library |
| Barcode rendering | bwip-js (browser build) |
| Barcode decoding | @zxing/library |
| Icons | Lucide React |
| Language | TypeScript 5 |

## Getting Started

```bash
# install dependencies
npm install

# start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can also pre-fill a URL via the query string:

```
http://localhost:3000/?url=https://github.com
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── favicon/route.ts    # Image proxy (avoids canvas tainting)
│   │   └── metadata/route.ts   # Site metadata fetcher (title, favicon, colors)
│   ├── globals.css              # Tailwind + custom slider/animation styles
│   ├── layout.tsx               # Root layout (Geist font, dark theme)
│   └── page.tsx                 # Entry point — passes ?url= to Atelier
├── components/
│   ├── atelier.tsx              # Shell: QR/Barcode mode switcher + header
│   ├── barcode-studio.tsx       # Barcode controls, preview, export
│   ├── controls.tsx             # Shared UI primitives (Section, Segmented, ColorField, etc.)
│   ├── qr-preview.tsx           # QR canvas, scan check, export, live scanner
│   ├── qr-studio.tsx            # QR controls: URL input, creativity, style, colors, logo
│   └── scanner.tsx              # Camera/file QR scanner (html5-qrcode)
├── lib/
│   ├── barcode.ts               # Barcode render/decode via bwip-js + zxing
│   ├── color.ts                 # Color utils, palette extraction, WCAG contrast
│   ├── creativity.ts            # Creativity slider → QR style mapping
│   ├── logo-overlay.ts          # Deterministic logo draw on QR canvas
│   ├── metadata.ts              # Client-side fetch helpers for /api/metadata
│   ├── qr-options.ts            # Builds qr-code-styling options from settings
│   ├── readability.ts           # QR decode (jsQR + zxing), heuristic scoring
│   ├── server-http.ts           # Safe URL validation, fetch with timeout + UA
│   └── types.ts                 # Shared TypeScript types and defaults
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Privacy

- No data leaves your browser except when you explicitly paste a URL (fetched server-side to extract metadata).
- QR codes and barcodes are rendered entirely client-side.
- The server proxy only fetches public URLs and blocks private/local addresses (SSRF protection).
- No analytics, no cookies, no tracking.

## License

MIT
