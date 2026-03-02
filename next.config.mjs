/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Exclude /* paths (handled by Next.js route handlers) to avoid double / prefix
        source: '/:path((?!api/).*)*',
        destination: 'http://localhost:5001/:path*',
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      'storage.googleapis.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Remove powered by header for security
  poweredByHeader: false,
  // Enable strict mode for better performance
  reactStrictMode: true,
}

export default nextConfig
