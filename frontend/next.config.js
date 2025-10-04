/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set workspace root to resolve multiple lockfiles warning
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  
  // Development optimizations
  experimental: {
    // Enable faster refresh for development
    esmExternals: 'loose',
  },
  
  // Webpack configuration for better development experience
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable faster builds in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
  
  // API routes configuration
  api: {
    // Increase body size limit for file uploads
    bodyParser: {
      sizeLimit: '50mb',
    },
    // Increase response timeout for processing
    responseLimit: false,
  },
}

module.exports = nextConfig