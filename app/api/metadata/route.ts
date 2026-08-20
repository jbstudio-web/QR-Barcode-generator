import { NextRequest } from "next/server";
import { fetchWithTimeout, finalUrlOf, isSafeUrl } from "@/lib/server-http";
import type { BrandInfo } from "@/lib/types";

const TIMEOUT_MS = 9000;
const MAX_HTML = 2_000_000;

function unescape(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) =>
      String.fromCharCode(parseInt(d, 10)),
    );
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(`<meta[^>]*${key}[^>]*>`, "i");
  const m = html.match(re);
  if (!m) return null;
  const content = m[0].match(/content\s*=\s*(["'])(.*?)\1/i);
  return content ? content[2].trim() : null;
}

function hrefOf(tag: string): string | null {
  const m = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
  return m ? m[2].trim() : null;
}

function parseHtml(
  html: string,
  base: string,
): Pick<BrandInfo, "title" | "description" | "favicon" | "appleTouchIcon" | "ogImage" | "themeColor"> {
  const baseUrl = new URL(base);
  const resolve = (href: string): string | null => {
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return null;
    }
  };

  const ogTitle =
    metaContent(html, 'property="og:title"') ??
    metaContent(html, 'name="og:title"');
  let title: string | null =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  if (ogTitle) title = ogTitle;

  const description =
    metaContent(html, 'name="description"') ??
    metaContent(html, 'property="og:description"') ??
    metaContent(html, 'name="twitter:description"');

  const themeColor =
    metaContent(html, 'name="theme-color"') ??
    metaContent(html, 'name="msapplication-TileColor"');

  const ogImage =
    metaContent(html, 'property="og:image"') ??
    metaContent(html, 'name="twitter:image"');

  const links = [...html.matchAll(/<link[^>]*>/gi)].map((m) => m[0]);

  let appleTouchIcon: string | null = null;
  for (const l of links) {
    if (/rel\s*=\s*["'][^"']*apple-touch-icon/i.test(l)) {
      const href = hrefOf(l);
      if (href) {
        appleTouchIcon = resolve(href);
        break;
      }
    }
  }

  const iconCandidates: string[] = [];
  for (const l of links) {
    if (!/rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(l)) continue;
    const href = hrefOf(l);
    if (!href) continue;
    const abs = resolve(href);
    if (abs) iconCandidates.push(abs);
  }

  let favicon: string | null = appleTouchIcon;
  if (!favicon) {
    favicon =
      iconCandidates.find((u) => /sizes\s*=\s*["'](?:32|48|64)/i.test(u)) ??
      iconCandidates[0] ??
      null;
  }
  if (!favicon) favicon = new URL("/favicon.ico", baseUrl).href;

  return {
    title: title ? unescape(title) : null,
    description: description ? unescape(description) : null,
    favicon,
    appleTouchIcon,
    ogImage: ogImage ? resolve(ogImage) : null,
    themeColor: themeColor && /^#[0-9a-fA-F]{3,8}$/.test(themeColor.trim()) ? themeColor.trim() : null,
  };
}

export async function GET(request: NextRequest) {
  const target = isSafeUrl(request.nextUrl.searchParams.get("url") ?? "");
  if (!target) {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const res = await fetchWithTimeout(target.href, TIMEOUT_MS, {
      Accept: "text/html,application/xhtml+xml",
    });
    if (!res.ok) {
      return Response.json({ error: "fetch_failed", status: res.status }, { status: 502 });
    }
    const finalUrl = finalUrlOf.get(res) || res.url || target.href;
    const contentType = res.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return Response.json({ error: "not_html", status: res.status }, { status: 415 });
    }
    const html = (await res.text()).slice(0, MAX_HTML);
    const meta = parseHtml(html, finalUrl);
    return Response.json({
      ...meta,
      url: finalUrl,
      domain: new URL(finalUrl).hostname.replace(/^www\./, ""),
    } satisfies BrandInfo);
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 502 });
  }
}
