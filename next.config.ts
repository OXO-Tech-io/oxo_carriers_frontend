/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  
  // MUST USE 'export' for cPanel hosting
  output: 'export',
  
  // Remove generateBuildId function when using export
  // generateBuildId: async () => {
  //   return `build-${Date.now()}`;
  // },
  
  // Important for static export
  images: {
    unoptimized: true, // MUST be true for static export
  },
  
  trailingSlash: true, // Recommended for better cPanel compatibility
  
  // Remove if you don't have basePath
  // basePath: '',
  
  // Other optimizations
  compress: true,
  poweredByHeader: false,
  
  // Optional: Add assetPrefix if using CDN
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://yourcdn.com' : '',
};

export default nextConfig;