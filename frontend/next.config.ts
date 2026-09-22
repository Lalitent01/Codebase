import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // reactCompiler: true, // Only if you have the plugin installed
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
