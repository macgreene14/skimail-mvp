/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/skimail-mvp",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
};

module.exports = nextConfig;
