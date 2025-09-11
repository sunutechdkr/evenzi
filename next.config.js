/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  
  // Configuration des headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Protection contre le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Protection contre le MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Protection XSS (pour les navigateurs plus anciens)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Contrôle des référents
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=(),',
              'microphone=(),',
              'geolocation=(self),',
              'interest-cohort=()'
            ].join(' ')
          },
          // Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  },
  
  images: {
    domains: [
      'localhost',
      'studio.evenzi.io',
      'evenzi.vercel.app',
      'res.cloudinary.com',
      'images.unsplash.com',
    ],
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  serverExternalPackages: ['sharp'],
  
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [/node_modules/, /backups/, /temp_.*\.(ts|tsx|js|jsx)$/],
    });
    return config;
  },
};

module.exports = nextConfig;
