import type { NextConfig } from "next";

// AdSense needs to load and frame third-party script, so script-src/frame-src
// cannot be 'self' alone. Everything else stays locked down.
const AD_HOSTS = [
  "https://pagead2.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://adservice.google.com",
  "https://www.googletagservices.com",
].join(" ");

// ponytail: static CSP string, no nonces — Next's inline bootstrap needs
// 'unsafe-inline' here. Swap to nonce-based via middleware if you ever serve
// user-generated content.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${AD_HOSTS}`,
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: cover the generated QR canvas exports; https: covers proxied favicons.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${AD_HOSTS} https://pagead2.googlesyndication.com`,
  `frame-src ${AD_HOSTS}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            // Scanner needs the camera; nothing else does.
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
