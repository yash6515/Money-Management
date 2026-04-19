/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Keep pdf-parse out of the webpack bundle — we load it via
    // createRequire at runtime so it must exist as a real file on disk.
    serverComponentsExternalPackages: ["pdf-parse"],
    // Make sure Vercel's file tracer ships pdf-parse with the
    // serverless function (createRequire paths aren't auto-traced).
    outputFileTracingIncludes: {
      "/api/parse-pdf": ["./node_modules/pdf-parse/**/*"],
    },
  },
};
module.exports = nextConfig;
