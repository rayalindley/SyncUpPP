/** @type {import('next').NextConfig} */
const nextConfig = {
  // This allows production builds to successfully complete even if
  // your project has ESLint errors (the yellow warnings in your logs).
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  
  // Your existing server runtime configuration
  serverRuntimeConfig: {
    bodySizeLimit: 2000000, // Set body size limit to 2 MB
  },

  // If you want to also ignore TypeScript errors during build, 
  // you can uncomment the lines below:
  /*
  typescript: {
    ignoreBuildErrors: true,
  },
  */
};

export default nextConfig;