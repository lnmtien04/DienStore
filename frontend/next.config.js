/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 FIX lỗi sai root (quan trọng nhất)
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],

    // 🔥 FIX warning quality
    qualities: [75, 100],

    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Proxy API requests to backend during development
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;