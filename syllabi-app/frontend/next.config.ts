import type { NextConfig } from 'next';

/**
 * Next.js configuration
 *
 * Preconditions:
 * - Next.js 16+ must be installed (uses Turbopack by default)
 * - TypeScript must be configured
 *
 * Postconditions:
 * - Sets security headers
 * - Enables production optimizations
 * - Configures Turbopack (Next.js 16+ default bundler)
 * - Configures serverActions for file uploads
 *
 * Note: Next.js 16+ uses Turbopack by default instead of webpack
 * Turbopack config includes root directory setting for proper resolution
 */
const nextConfig: NextConfig = {
  /**
   * Turbopack configuration
   * Next.js 16+ uses Turbopack by default
   * root: Specifies the project root directory for proper file resolution
   */
  turbopack: {
    root: __dirname,
  },

  /**
   * Experimental features
   * serverActions.bodySizeLimit handles file upload size limits
   */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /**
   * Environment variables exposed to the browser
   * Note: Only expose non-sensitive values here
   */
  env: {
    APP_NAME: 'Syllabus to Calendar',
    APP_VERSION: '1.0.0',
  },
  /**
   * Headers for security and CORS
   */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
        ],
      },
    ];
  },

  /**
   * Redirects
   */
  async redirects() {
    return [];
  },

  /**
   * Rewrites
   */
  async rewrites() {
    return [];
  },

  /**
   * Image optimization
   */
  images: {
    remotePatterns: [],
  },

  /**
   * PoweredBy header (disable for security)
   */
  poweredByHeader: false,

  /**
   * Strict mode for development
   */
  reactStrictMode: true,
};

export default nextConfig;