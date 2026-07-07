import type { NextConfig } from "next";

// When served behind Firebase Hosting at gaiaapp.net/<basePath>, the app is
// built with NEXT_PUBLIC_BASE_PATH (e.g. "/vault-app") so every route, asset
// and link lives under that prefix. Unset (Vercel, local dev) it serves at /.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Self-contained server bundle for the Cloud Run container image.
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  // Security headers applied to every response. The vault holds the most
  // sensitive data a person owns, so we lock the browser down hard.
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
