/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/skimail-mvp",
  env: {
    NEXT_PUBLIC_BUILD_VERSION: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  },
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
