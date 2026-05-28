/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Не бандлим нативные модули — пусть Node.js загружает их напрямую
      config.externals.push('pdf-parse', 'mammoth', '@napi-rs/canvas', 'canvas')
    }
    return config
  },
}

module.exports = nextConfig
