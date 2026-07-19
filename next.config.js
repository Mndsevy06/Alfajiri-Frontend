/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },

  // Fix ERR_MEMORY_ALLOCATION_FAILED: reduce webpack memory pressure
  webpack: (config, { dev, isServer }) => {
    // 1. Cache strategy:
    //    - Dev: use memory cache to avoid "PureExpressionDependency" webpack
    //      serialisation errors that corrupt the filesystem cache in Next 13.
    //    - Prod: filesystem cache (no compression) to keep RAM usage low.
    if (dev) {
      config.cache = { type: 'memory' };
    } else {
      config.cache = {
        type: 'filesystem',
        name: isServer ? 'server' : 'client',
        compression: false,
      };
    }

    // 2. Limit webpack's parallelism so it doesn't try to
    //    decompress dozens of modules simultaneously in memory.
    config.parallelism = 1;

    // 3. In dev mode, reduce the number of chunks webpack keeps in memory
    if (dev) {
      // Disable source maps in dev to save memory (they're large)
      config.devtool = false;

      // Reduce the number of parallel loaders
      config.module = config.module || {};
      config.module.rules = (config.module.rules || []).map((rule) => {
        if (rule && rule.use && Array.isArray(rule.use)) {
          rule.use = rule.use.map((loader) => {
            if (loader && loader.options && loader.options.workerThreads !== undefined) {
              loader.options.workerThreads = false;
            }
            return loader;
          });
        }
        return rule;
      });
    }

    return config;
  },

  // 4. Transpile heavy packages so Next.js handles them more efficiently
  transpilePackages: [
    'framer-motion',
    'recharts',
    'react-d3-tree',
  ],

  // 5. Disable experimental features that increase memory pressure
  experimental: {
    // Disable SWC minification if memory is still an issue
    // swcMinify: false,
  },
};

module.exports = nextConfig;
