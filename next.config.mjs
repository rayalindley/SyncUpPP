/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other configurations...
  serverRuntimeConfig: {
    // Other server runtime configurations...
    bodySizeLimit: 2000000, // Set body size limit to 2 MB
  },
};

export default nextConfig;
