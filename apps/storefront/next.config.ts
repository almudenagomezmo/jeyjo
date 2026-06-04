import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@jeyjo/pricing", "@jeyjo/stock-ports", "@jeyjo/erp-ports"],
  // Workspace packages use Node-style `.js` import specifiers in TS sources.
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
  // Product imagery in this scaffold is rendered as inline SVG (see ProductGlyph),
  // so no remote image domains are configured. Add `images.remotePatterns` here
  // when you wire a real DAM / CDN.
};

export default nextConfig;
