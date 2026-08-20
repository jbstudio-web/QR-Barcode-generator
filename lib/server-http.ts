const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Private/reserved IPv4 ranges + IPv6 loopback/ULA/link-local. */
function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".localhost")) {
    return true;
  }
  const v6 = host.replace(/^\[|\]$/g, "");
  if (v6.includes(":")) {
    // ::1 loopback, fc00::/7 ULA, fe80::/10 link-local, ::ffff:x.x.x.x mapped
    if (/^::1$/.test(v6) || /^f[cd]/i.test(v6) || /^fe[89ab]/i.test(v6)) return true;
    // URL normalizes ::ffff:1.2.3.4 to hex (::ffff:102:304) — handle both.
    const dotted = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (dotted) return isPrivateHost(dotted[1]);
    const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (hex) {
      const n = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
      return isPrivateHost([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
    }
    return false;
  }
  const m = v6.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = m.slice(1).map(Number);
  if (m.slice(1).some((n) => Number(n) > 255)) return true;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) ||           // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224                              // multicast + reserved
  );
}

/** Only allow public http(s) URLs — guards against SSRF via private ranges. */
export function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Credentials in the URL can be replayed at the redirect target.
  if (url.username || url.password) return null;
  return isPrivateHost(url.hostname.toLowerCase()) ? null : url;
}

/** Final URL after our manual redirect chain (res.url is empty in manual mode). */
export const finalUrlOf = new WeakMap<Response, string>();

export async function fetchWithTimeout(
  url: string,
  ms: number,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  // Follow redirects by hand so each hop is re-checked against isSafeUrl.
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(ms),
      headers: { "User-Agent": UA, ...extraHeaders },
    });
    if (res.status < 300 || res.status > 399) {
      finalUrlOf.set(res, current);
      return res;
    }
    const loc = res.headers.get("location");
    if (!loc) {
      finalUrlOf.set(res, current);
      return res;
    }
    const next = isSafeUrl(new URL(loc, current).href);
    if (!next) throw new Error("unsafe_redirect");
    current = next.href;
  }
  throw new Error("too_many_redirects");
}
