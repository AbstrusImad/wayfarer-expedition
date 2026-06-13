/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '/wayfarer-expedition',
  trailingSlash: true,
};

module.exports = nextConfig;
