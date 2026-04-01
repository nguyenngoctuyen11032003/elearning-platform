/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5001/uploads/:path*',
      },
    ]
  },
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      'storage.googleapis.com',
      'learn.icss.com.vn',
    ],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5001', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'learn.icss.com.vn', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'learn.icss.com.vn', pathname: '/api/uploads/**' },
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
  // Tell Next.js to load pdfjs-dist via native Node.js ESM import instead of
  // bundling it through webpack (which crashes because pdf.mjs uses top-level syntax
  // incompatible with webpack's module-init layer).
  serverExternalPackages: ['pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.mjs'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Remove powered by header for security
  poweredByHeader: false,
  // Enable strict mode for better performance
  reactStrictMode: true,
}

export default nextConfig
