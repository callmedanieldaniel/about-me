import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "XVIS — Visualize everything",
    template: "%s — XVIS",
  },
  description:
    "XVIS — see the world as data. 89 interactive demos across driving, robotics, maps, simulation, annotation, data loops, 3D, AI, markets, science and industry, all running in the browser on real engines.",
  referrer: "no-referrer",
  openGraph: {
    title: "XVIS — Visualize everything",
    description:
      "See the world as data: interactive demos for driving, robotics, maps, simulation, AI and more, running in the browser.",
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
