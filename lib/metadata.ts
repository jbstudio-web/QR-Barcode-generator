import type { BrandInfo } from "./types";

export async function fetchBrand(url: string): Promise<BrandInfo | null> {
  try {
    const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as BrandInfo;
  } catch {
    return null;
  }
}

/** Route an arbitrary image through the same-origin proxy (canvas-safe). */
export function proxyImageUrl(src: string): string {
  return `/api/favicon?url=${encodeURIComponent(src)}`;
}
