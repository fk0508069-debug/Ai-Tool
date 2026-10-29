import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 Add tesseract.js to the externals list
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "tesseract.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;