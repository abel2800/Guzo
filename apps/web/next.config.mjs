const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4000';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@delivery/types', '@delivery/utils'],
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
