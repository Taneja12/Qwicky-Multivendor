import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 1. Unsplash Domain
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // 2. Cloudinary Domain
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**', 
      },
      // 3. Local development
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      // 4. Add localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Set to true if you want to ignore TypeScript errors during build
  },
  /* other config options here */
};

export default nextConfig;