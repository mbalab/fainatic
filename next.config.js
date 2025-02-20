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

  // Optimize build
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              if (!module.context) return 'lib';
              const match = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              return `lib.${match ? match[1].replace('@', '') : 'vendor'}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      },
    };

    return config;
  },

  // Page configuration
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  compress: true,
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },

  // Timeouts
  staticPageGenerationTimeout: 120,

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
