import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  logging: {
    browserToTerminal: true,
  },
};

export default nextConfig;
