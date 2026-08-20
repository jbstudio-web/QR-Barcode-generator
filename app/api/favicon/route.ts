import { NextRequest } from "next/server";
import { fetchWithTimeout, isSafeUrl } from "@/lib/server-http";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 5_000_000;

export async function GET(request: NextRequest) {
  const target = isSafeUrl(request.nextUrl.searchParams.get("url") ?? "");
  if (!target) {
    return new Response("invalid", { status: 400 });
  }
  try {
    const res = await fetchWithTimeout(target.href, TIMEOUT_MS);
    if (!res.ok) return new Response("failed", { status: 502 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return new Response("too_large", { status: 413 });
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    return new Response(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("failed", { status: 502 });
  }
}
