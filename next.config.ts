import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable gzip / brotli compression for all text/html/json responses
  compress: true,

  // Disables the X-Powered-By: Next.js HTTP header for security and reduced header overhead
  poweredByHeader: false,

  // Strict mode for better React performance and highlighting potential issues
  reactStrictMode: true,

  // Production compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Long-term cache headers for static files, fonts, and assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|ico|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
