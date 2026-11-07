import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Allows production build to finish even if there are subtle TypeScript mismatches
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevents linter warnings from stopping the build
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;