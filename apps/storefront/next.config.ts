import type { NextConfig } from "next";

function catalogImageRemotePatterns(): Array<{
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
}> {
  const defaults = [
    { protocol: "https" as const, hostname: "example.com", pathname: "/**" },
    { protocol: "http" as const, hostname: "localhost", pathname: "/**" },
    { protocol: "http" as const, hostname: "127.0.0.1", pathname: "/**" },
  ];
  const extra = (process.env.CATALOG_IMAGE_REMOTE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .flatMap((hostname) => [
      { protocol: "https" as const, hostname, pathname: "/**" },
      { protocol: "http" as const, hostname, pathname: "/**" },
    ]);
  return [...defaults, ...extra];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@jeyjo/pricing", "@jeyjo/stock-ports", "@jeyjo/erp-ports", "@jeyjo/catalog-images"],
  serverExternalPackages: ["onnxruntime-node", "@xenova/transformers", "sharp"],
  // Workspace packages use Node-style `.js` import specifiers in TS sources.
  webpack: (config, { isServer }) => {
    config.resolve ??= {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };

    if (isServer) {
      config.externals ??= [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          "onnxruntime-node",
          "@xenova/transformers",
          "sharp",
        );
      }
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        "@xenova/transformers": false,
      };
    }

    return config;
  },
  images: {
    remotePatterns: catalogImageRemotePatterns(),
  },
};

export default nextConfig;
