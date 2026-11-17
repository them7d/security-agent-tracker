import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-91f7e5bb-7fb5-4358-a3ef-65e5cb2f4087.space-z.ai",
    "*.space-z.ai",
  ],
};

export default nextConfig;
