import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  transpilePackages: ['@repo/ui', '@repo/auth', '@repo/database'],
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080',
  },
  
  // Webpack configuration
  webpack: (config, { webpack }) => {
    config.plugins.push(new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
    }))

    return config
  },

  // Image optimization for better performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@repo/ui', 'lucide-react'],
  },
};

export default nextConfig; 