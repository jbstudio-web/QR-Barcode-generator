import { NextRequest } from "next/server";
import { fetchWithTimeout, isSafeUrl } from "@/lib/server-http";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 5_000_000;

/** Only ever proxy images — otherwise this route serves attacker HTML/JS from our origin. */
const ALLOWED_TYPES = /^image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml|x-icon|vnd\.microsoft\.icon)$/i;

export async function GET(request: NextRequest) {
  const target = isSafeUrl(request.nextUrl.searchParams.get("url") ?? "");
  if (!target) {
    return new Response("invalid", { status: 400 });
  }
  try {
    const res = await fetchWithTimeout(target.href, TIMEOUT_MS, { Accept: "image/*" });
    if (!res.ok) return new Response("failed", { status: 502 });

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!ALLOWED_TYPES.test(contentType)) {
      return new Response("not_image", { status: 415 });
    }
    // Reject oversized bodies before buffering them.
    const declared = Number(res.headers.get("content-length"));
    if (declared > MAX_BYTES) return new Response("too_large", { status: 413 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return new Response("too_large", { status: 413 });
    }

    return new Response(buf, {
      headers: {
        // SVG can carry script; force it to download-only rather than render.
        "Content-Type": contentType,
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("failed", { status: 502 });
  }
}
