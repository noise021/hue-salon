import type { Metadata } from "next";
import { Inter_Tight, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-salon",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "hue. | hair atelier aoyama",
  description:
    "hue. は東京・青山のヘアアトリエ。カットとカラーで、あなたの輪郭に一番きれいな影と光を仕込みます。(デモサイト)",
  robots: { index: false, follow: false }, // デモのため noindex
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body
        className={`${interTight.variable} ${notoSansJP.variable} ${shipporiMincho.variable} antialiased`}
        style={{ fontFamily: "var(--font-salon), var(--font-sans), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
