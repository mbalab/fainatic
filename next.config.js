/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude test files from pdf-parse
    config.module.rules.push({
      test: /pdf\.js$/,
      include: /pdf-parse/,
      use: 'null-loader',
    });

    return config;
  },
};

module.exports = withPWA(nextConfig); 