const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Only allow public http(s) URLs — guards against SSRF via private ranges. */
export function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".localhost")
  ) {
    return null;
  }
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return null;
  if (host === "::1" || host === "[::1]") return null;
  return url;
}

export async function fetchWithTimeout(
  url: string,
  ms: number,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(ms),
    headers: {
      "User-Agent": UA,
      ...extraHeaders,
    },
  });
}
