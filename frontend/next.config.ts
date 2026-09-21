import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
const nextConfig: NextConfig = {
  output: 'standalone', // <--- REQUIRED for the Dockerfile above
  reactCompiler: true,
};
export default nextConfig;