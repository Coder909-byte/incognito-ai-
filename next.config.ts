import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[contenthash].js",
      },
    });
    return config;
  },
};

export default nextConfig;