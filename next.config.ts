import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['i.scdn.co'], // Add Spotify's image domain
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // the route reads the sealed private entries at request time, by a path
  // the bundler cannot see, so the file has to be shipped with it explicitly
  outputFileTracingIncludes: {
    '/api/library/private': ['./content/cool-private.json'],
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
      { source: '/graph', destination: 'https://graph.isaacchacko.com', permanent: false },
      { source: '/graph/:path*', destination: 'https://graph.isaacchacko.com/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
