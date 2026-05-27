import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shen Yang | AD AI Tooling Frontend Engineer",
  description:
    "Frontend and full-stack engineer building autonomous-driving AI tooling, 3D scene playback, real-time visualization, and high-performance streaming systems.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
