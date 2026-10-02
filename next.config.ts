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
      // learnings became dumps became blog, and cool became library; the old
      // links were public, so they keep working
      { source: '/learnings', destination: '/blog', permanent: true },
      { source: '/learnings/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/dumps', destination: '/blog', permanent: true },
      { source: '/dumps/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/cool', destination: '/library', permanent: true },
    ];
  },
};

export default nextConfig;
