import { dirname } from 'path';
import { fileURLToPath } from 'url';
import nextPWA from 'next-pwa';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  webpack: (config) => {
    // Add polyfills for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      child_process: false,
      fs: false,
      net: false,
      tls: false,
    };

    // Исключаем тестовые файлы pdf-parse из сборки
    config.module.rules.push({
      test: /node_modules\/pdf-parse\/test/,
      use: 'null-loader',
    });

    return config;
  },
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default withPWA(nextConfig);
