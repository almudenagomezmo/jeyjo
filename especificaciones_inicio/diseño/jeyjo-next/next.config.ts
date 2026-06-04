import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Product imagery in this scaffold is rendered as inline SVG (see ProductGlyph),
  // so no remote image domains are configured. Add `images.remotePatterns` here
  // when you wire a real DAM / CDN.
};

export default nextConfig;
