import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "OMNIVIS — Visualize everything",
    template: "%s — OMNIVIS",
  },
  description:
    "An open visualization platform for autonomous driving, embodied AI, simulation, world models, 3D digital twins, AI systems and markets. Interactive labs that run in your browser, backed by real engines.",
  referrer: "no-referrer",
  openGraph: {
    title: "OMNIVIS — Visualize everything",
    description:
      "Interactive labs for autonomous driving, robotics, simulation, 3D and AI systems. Runs locally in the browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-grid" aria-hidden />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
