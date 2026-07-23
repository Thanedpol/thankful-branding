/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Admin collection saves post a JSON payload that can exceed the 1 MB
    // default (a medium collection with full session bodies), so give it room.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow any https image host — admins paste cover/thumbnail URLs from
    // arbitrary sites (news CDNs, etc.), so the optimizer must accept them all.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
