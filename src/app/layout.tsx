import type { Metadata } from "next";
import { Space_Grotesk, Inter, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Thank Thanedpol — AI Engineer & Researcher",
  description:
    "Personal brand of Thank Thanedpol — building intelligent systems from the future. Portfolio, writing, and press kit.",
  openGraph: {
    title: "Thank Thanedpol — AI Engineer & Researcher",
    description: "Building intelligent systems from the future.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${shareTechMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
