/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Configurações para o lado do cliente
    if (!isServer) {
      // Fallbacks para módulos Node.js no cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        querystring: false,
        util: false,
        buffer: false,
        events: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        module: false,
        perf_hooks: false,
        punycode: false,
        readline: false,
        repl: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        v8: false,
        vm: false,
        worker_threads: false,
        // Específicos para Bull
        bull: false,
        ioredis: false,
        redis: false,
      }

      // Alias para ignorar completamente Bull e Redis no cliente
      config.resolve.alias = {
        ...config.resolve.alias,
        bull: false,
        ioredis: false,
        redis: false,
        'bull/lib/process/master.js': false,
        'bull/lib/process/child-pool.js': false,
        'bull/lib/process': false,
        'bull/lib/queue.js': false,
        'bull/index.js': false,
      }
    }

    // Externals para ambos servidor e cliente
    config.externals = config.externals || []
    if (typeof config.externals === 'function') {
      const originalExternals = config.externals
      config.externals = (context, request, callback) => {
        // Ignorar Bull completamente no cliente
        if (!isServer && (
          request === 'bull' || 
          request === 'ioredis' || 
          request === 'redis' ||
          request.startsWith('bull/') ||
          request.includes('bull/lib/process')
        )) {
          return callback(null, 'commonjs ' + request)
        }
        return originalExternals(context, request, callback)
      }
    } else {
      config.externals.push((context, request, callback) => {
        if (!isServer && (
          request === 'bull' || 
          request === 'ioredis' || 
          request === 'redis' ||
          request.startsWith('bull/') ||
          request.includes('bull/lib/process')
        )) {
          return callback(null, 'commonjs ' + request)
        }
        callback()
      })
    }

    // Regras de módulo para usar null-loader
    config.module.rules.push({
      test: /bull\/lib\/process\/(master|child-pool)\.js$/,
      use: 'null-loader',
    })

    config.module.rules.push({
      test: /node_modules\/bull\//,
      use: isServer ? 'null-loader' : 'null-loader',
      exclude: isServer ? undefined : /.*/,
    })

    // Plugin para ignorar módulos problemáticos
    if (webpack && webpack.IgnorePlugin) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^bull$/,
          contextRegExp: /^(?!.*server)/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^ioredis$/,
          contextRegExp: /^(?!.*server)/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /bull\/lib\/process\/(master|child-pool)\.js$/,
        })
      )
    }

    return config
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig