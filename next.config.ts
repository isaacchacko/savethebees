import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['i.scdn.co'], // Add Spotify's image domain
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  async redirects() {
    return [
      { source: '/tracking', destination: '/running', permanent: true },
      // learnings became dumps; the old links were public, so they keep working
      { source: '/learnings', destination: '/dumps', permanent: true },
      { source: '/learnings/:slug', destination: '/dumps/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
