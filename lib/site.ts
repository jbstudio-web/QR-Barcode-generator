export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ?? "http://localhost:3000";