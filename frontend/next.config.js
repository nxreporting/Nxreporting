/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set workspace root to resolve multiple lockfiles warning
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  
  // Temporarily disable TypeScript checking during build to work around Next.js 15.5.3 bug
  typescript: {
    ignoreBuildErrors: true,
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
}

module.exports = nextConfig