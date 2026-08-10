/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Product images are served locally from /public/products, so no remote
    // hosts are needed. Add hostnames here only if you decide to hotlink.
    remotePatterns: [],
  },
};

module.exports = nextConfig;
