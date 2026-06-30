import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Serif display face — warm, soft, a little editorial. Carries the Gaia voice.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "460", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Clean, highly legible sans for body and UI.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gaia Vault — Organise what matters, for the people you trust",
    template: "%s · Gaia Vault",
  },
  description:
    "Gaia Vault helps you gently organise your wishes, people, documents and messages — and share them, with care, with the people you trust.",
  applicationName: "Gaia Vault",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net",
  ),
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gaia Vault", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1f3729",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
