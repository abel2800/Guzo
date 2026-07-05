/** @type {import('next').NextConfig} */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@delivery/types', '@delivery/utils'],
  // Proxy REST calls through Next in dev so the browser talks same-origin (no CORS).
  // In production, point NEXT_PUBLIC_API_URL at the real API and drop this rewrite.
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
