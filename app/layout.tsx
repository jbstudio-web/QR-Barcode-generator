import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "QR Atelier — QR & Barcode Studio";
const description =
  "Design branded, scannable QR codes and standards-compliant 1D barcodes. Brand colors, logos, gradients, a live scanability check — right in the browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "QR Atelier",
  title,
  description,
  keywords: [
    "QR code generator",
    "branded QR codes",
    "QR code with logo",
    "QR code designer",
    "barcode generator",
    "Code 128",
    "EAN-13",
    "scanability check",
    "free QR code",
  ],
  authors: [{ name: "QR Atelier" }],
  creator: "QR Atelier",
  publisher: "QR Atelier",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "QR Atelier",
    title,
    description,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}