import type { Metadata, Viewport } from "next";
import { Taviraj, Poppins } from "next/font/google";
import "./globals.css";

// Serif display face from the Gaia LIFE design system — headings only.
const taviraj = Taviraj({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-taviraj",
  display: "swap",
});

// LIFE body/UI face — Poppins, never used for headings.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gaia Vault · Organise what matters, for the people you trust",
    template: "%s · Gaia Vault",
  },
  description:
    "Gaia Vault helps you gently organise your wishes, people, documents and messages, and share them, with care, with the people you trust.",
  applicationName: "Gaia Vault",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vault.gaiaapp.net",
  ),
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gaia Vault", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1D4641",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${taviraj.variable} ${poppins.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
