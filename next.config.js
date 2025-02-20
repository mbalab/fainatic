/** @type {import('next').NextConfig} */
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
// });

const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  poweredByHeader: false,
  swcMinify: true,
  reactStrictMode: true,
  generateEtags: false,

  // App Router configuration
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    optimizeCss: true,
  },

  // Page configuration
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  compress: true,

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
