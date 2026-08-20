export type SocialPlatform = "telegram" | "instagram";

function logo(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const TELEGRAM_LOGO = logo(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path fill="#ffffff" d="M9.04 15.51l-.36 3.51c.49 0 .7-.21.96-.46l2.3-2.2 4.77 3.5c.87.48 1.5.23 1.72-.81l3.12-14.7c.28-1.28-.47-1.78-1.32-1.47L1.5 9.97c-1.25.49-1.24 1.2-.23 1.51l4.98 1.56 11.55-7.28c.51-.31.98-.14.6.18L9.04 15.51z"/></svg>`,
);

const INSTAGRAM_LOGO = logo(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5"><rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="#ffffff" stroke="none"/></svg>`,
);

export interface SocialPreset {
  label: string;
  /** Brand icon as a data URL, drawn as the QR center logo. */
  icon: string;
  placeholder: string;
  url: (username: string) => string;
  palette: {
    ink: string;
    accent: string;
    bg: string;
    bg2: string;
  };
}

export const SOCIAL_PRESETS: Record<SocialPlatform, SocialPreset> = {
  telegram: {
    label: "Telegram",
    icon: TELEGRAM_LOGO,
    placeholder: "telegram username",
    url: (u) => `https://t.me/${u}`,
    palette: {
      ink: "#0f1a24",
      accent: "#229ed9",
      bg: "#eef6fb",
      bg2: "#d9edf9",
    },
  },
  instagram: {
    label: "Instagram",
    icon: INSTAGRAM_LOGO,
    placeholder: "instagram username",
    url: (u) => `https://instagram.com/${u}`,
    palette: {
      ink: "#241f33",
      accent: "#d62976",
      bg: "#fdf4f8",
      bg2: "#fbe3ef",
    },
  },
};

/** Strip leading @ signs and whitespace from a social handle. */
export function cleanSocialHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}