import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chrome on this machine calls the dev server by IP, which Next otherwise
  // rejects as a cross-site dev request and then never hydrates the page.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
