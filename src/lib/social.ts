/**
 * Thankful's social profiles — one list used by the pop-up book on the home
 * page, the structured data (sameAs) and llms.txt, so all three always agree.
 */
export type SocialPlatform = "instagram" | "facebook" | "tiktok";

export interface SocialProfile {
  platform: SocialPlatform;
  label: string;
  handle: string;
  url: string;
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  { platform: "instagram", label: "Instagram", handle: "@newerathank", url: "https://www.instagram.com/newerathank/" },
  { platform: "facebook", label: "Facebook", handle: "Thankhuge2016", url: "https://www.facebook.com/Thankhuge2016" },
  { platform: "facebook", label: "Facebook", handle: "Lastmemever", url: "https://www.facebook.com/Lastmemever" },
  { platform: "tiktok", label: "TikTok", handle: "@thankful63", url: "https://www.tiktok.com/@thankful63" },
];

/** Profiles that aren't pages of the pop-up book but belong to the same
 *  person — listed in sameAs, the footer and llms.txt. */
export const LINKEDIN_URL = "https://www.linkedin.com/in/thanedpol-dechaduangsakul-64b9b5137/";
export const GITHUB_URL = "https://github.com/Thanedpol";
