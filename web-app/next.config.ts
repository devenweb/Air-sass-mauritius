import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/mauritius',
        destination: '/destinations/mauritius',
        permanent: true,
      },
      {
        source: '/rodrigues',
        destination: '/destinations/rodrigues',
        permanent: true,
      },
      {
        source: '/flight',
        destination: '/flights',
        permanent: true,
      },
      {
        source: '/tours',
        destination: '/guided-group-tours',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/admin/royaltravel2026',
        destination: 'https://royaltravel-2026-admin.vercel.app/',
      },
      {
        source: '/admin/royaltravel2026/:path*',
        destination: 'https://royaltravel-2026-admin.vercel.app/:path*',
      },
      {
        source: '/admin',
        destination: 'https://royaltravel-2026-admin.vercel.app/',
      },
      {
        source: '/admin/:path*',
        destination: 'https://royaltravel-2026-admin.vercel.app/:path*',
      },
      {
        source: '/administration',
        destination: 'https://royaltravel-2026-admin.vercel.app/',
      },
      {
        source: '/administration/:path*',
        destination: 'https://royaltravel-2026-admin.vercel.app/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'qhrmzuwawmuxrnaqznva.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

export default nextConfig;
