import { naqidOgImage, NAQID_OG_ALT, NAQID_OG_SIZE } from "@/lib/naqid-og";

export const alt = NAQID_OG_ALT;
export const size = NAQID_OG_SIZE;
export const contentType = "image/png";

export default function NaqidOpengraphImage() {
  return naqidOgImage();
}
