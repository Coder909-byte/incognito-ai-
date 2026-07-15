import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. ADD THIS: Exclude native node binaries from the server compile
  serverExternalPackages: ["@huggingface/transformers"],

  webpack: (config) => {
    // Keep your existing worker rule completely intact!
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[contenthash].js",
      },
    });

    // 2. ADD THIS: Allow WebAssembly experiments for ONNX Runtime Web
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;