import { brandOgImage, OG_SIZE } from "@/lib/brand-og";

export const alt = "Thank Thanedpol — AI · Business · Science & Technology news";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return brandOgImage();
}
