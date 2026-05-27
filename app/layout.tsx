import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Crimson_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZIV — Visualization Engineer",
  description:
    "Frontend visualization engineer. Map SDKs, 3D scene tooling, real-time data viz at Baidu, Alibaba, NIO, DiDi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
