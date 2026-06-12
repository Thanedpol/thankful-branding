/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public/signed URLs
      { protocol: "https", hostname: "*.supabase.co" },
      // Allow common placeholder/CDN hosts during development
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
