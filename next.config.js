/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bind to all interfaces so Docker port mapping (3000:3000) works
  // Without this Next.js dev server only listens on 127.0.0.1 inside
  // the container and ERR_CONNECTION_REFUSED appears in the browser.
  experimental: {},
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
