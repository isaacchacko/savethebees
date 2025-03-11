import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['i.scdn.co'], // Add Spotify's image domain
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
