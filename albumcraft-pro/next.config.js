/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    // Removido serverComponentsExternalPackages - movido para serverExternalPackages
  },
  serverExternalPackages: ['sharp', 'bull', 'ioredis'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Evitar que Bull seja incluído no bundle do cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bull: false,
        ioredis: false,
        redis: false,
      }
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'albumcraft-pro-photos.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'albumcraft-pro.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig