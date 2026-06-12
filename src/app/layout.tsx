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
  title: "Thank Thanedpol — Content Creator · AI & Business",
  description:
    "Thank Thanedpol — Content Creator covering AI & Business news across Thailand and worldwide. Portfolio, writing, and press kit.",
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
