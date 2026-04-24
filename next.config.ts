import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.externals.push({ pg: "commonjs pg" });
    return config;
  },
};

export default nextConfig;
