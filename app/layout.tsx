import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Fieldwork — 可视化分析与仿真实验平台",
    template: "%s — Fieldwork",
  },
  description:
    "探索自动驾驶、机器人、ROS、AI、3D 数字孪生与金融分析。以可操作、可追溯、可复现的工具理解复杂系统。",
  referrer: "no-referrer",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
