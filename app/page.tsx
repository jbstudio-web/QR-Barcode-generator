import type { Metadata } from "next";
import Atelier from "@/components/atelier";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: SITE_URL, type: "website" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QR Atelier",
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  description:
    "Design branded, scannable QR codes and standards-compliant 1D barcodes. Brand colors, logos, gradients, a live scanability check — right in the browser.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Auto-branding from any URL",
    "Live scanability verification",
    "Logo overlay",
    "PNG and SVG export",
    "Code 128, EAN, UPC and other 1D barcodes",
  ],
};

export default async function Home(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const raw = searchParams?.url;
  const initialUrl = typeof raw === "string" ? raw : "";
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Atelier initialUrl={initialUrl} />
    </>
  );
}