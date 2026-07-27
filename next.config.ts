import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Match upload MAX_BYTES (16MB). Default Server Action limit is 1MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
