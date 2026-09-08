import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Fieldwork — Spatial & Systems Engineering",
    template: "%s — Fieldwork",
  },
  description:
    "An anonymous engineering portfolio exploring 3D visualization, spatial data, autonomous systems, real-time streaming, and cross-platform tools.",
  referrer: "no-referrer",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
