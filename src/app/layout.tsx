import type { Metadata } from "next";
import {
  Space_Grotesk,
  Inter,
  Share_Tech_Mono,
  Noto_Sans_Thai,
  Noto_Sans_SC,
} from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

const SITE_TITLE = "Thank Thanedpol — AI, Business & Technology News";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

const notoSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI",
    "ปัญญาประดิษฐ์",
    "ข่าว AI",
    "AI news",
    "ธุรกิจ",
    "business",
    "เทคโนโลยี",
    "technology",
    "วิทยาศาสตร์",
    "science",
    "Thank Thanedpol",
    "content creator",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  verification: { google: "qn8OHedMHOxPLuIL" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "th_TH",
    alternateLocale: ["en_US", "zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

// Applies the saved theme before paint to avoid a flash of the wrong mode.
const noFlashTheme = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=t;var l=localStorage.getItem('locale');if(l)document.documentElement.lang=l;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${shareTechMono.variable} ${notoThai.variable} ${notoSC.variable} font-body antialiased`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
