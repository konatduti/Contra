/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  pageExtensions: ["page.tsx", "page.ts", "page.jsx", "page.js", "route.ts", "route.js"]
};

module.exports = nextConfig;
