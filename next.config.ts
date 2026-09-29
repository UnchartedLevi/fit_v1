import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.fits4l.xyz" }],
        destination: "https://fits4l.xyz/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "fit-v1.vercel.app" }],
        destination: "https://fits4l.xyz/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
