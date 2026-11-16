import { Poppins, IBM_Plex_Sans_Thai } from "next/font/google";
import "./naqid.css";

// NAQID brand type: Poppins 200/300/500 only (never 600+), IBM Plex Sans Thai
// 300 for body and 400–500 for headings. Loaded here so the Thankful pages
// don't download them.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "500"],
  variable: "--font-poppins",
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-plex-thai",
  display: "swap",
});

export default function NaqidLayout({ children }: { children: React.ReactNode }) {
  return <div className={`naqid ${poppins.variable} ${plexThai.variable}`}>{children}</div>;
}
