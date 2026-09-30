import type { NextConfig } from "next";

const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: {
    unoptimized: true,
  },
  output: "export",
  trailingSlash: true,
} satisfies NextConfig;

export default nextConfig;
