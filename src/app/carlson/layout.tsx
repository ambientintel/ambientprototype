import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Ambient Intelligence — Founder's Day 2026",
  description: "24/7 contactless and noninvasive monitoring engineered for memory care.",
  manifest: "/manifest-carlson.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ambient AI",
  },
  openGraph: {
    title: "Ambient Intelligence — Founder's Day 2026",
    description: "24/7 contactless and noninvasive monitoring engineered for memory care.",
    url: "https://ambientprototype.vercel.app/carlson",
    siteName: "Ambient Intelligence",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function CarlsonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
