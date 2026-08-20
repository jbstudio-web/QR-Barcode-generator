import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConsentBanner } from "@/components/consent-banner";
import { AdConfigProvider } from "@/components/ad-slot";

// Server-only env reads — no NEXT_PUBLIC_ prefix needed; the values are
// passed to the client through AdConfigProvider.
const AD_CLIENT = process.env.ADSENSE_CLIENT?.trim();

const AD_CONFIG = {
  client: AD_CLIENT ?? "",
  banner: process.env.ADSENSE_SLOT_BANNER?.trim() ?? "",
  sidebar: process.env.ADSENSE_SLOT_SIDEBAR?.trim() ?? "",
  footer: process.env.ADSENSE_SLOT_FOOTER?.trim() ?? "",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Atelier — QR & Barcode Studio",
  description:
    "Design branded, scannable QR codes and standards-compliant 1D barcodes. Brand colors, logos, gradients, a live scanability check — right in the browser.",
  other: AD_CLIENT ? { "google-adsense-account": AD_CLIENT } : {},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {AD_CLIENT && (
          /* Consent Mode v2 defaults must be set BEFORE the ad script loads. */
          <Script id="consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
try{if(localStorage.getItem('qra-consent')==='granted'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}`}
          </Script>
        )}
        <AdConfigProvider value={AD_CONFIG}>{children}</AdConfigProvider>
        {AD_CLIENT && <ConsentBanner />}
        {AD_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
