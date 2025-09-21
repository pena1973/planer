/** @type {import('next').NextConfig} */


const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // скрываем ворнинги "Critical dependency: the request of a dependency is an expression"
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /typeorm/ },
      ];
    }
    return config;
  },
};

// module.exports = nextConfig;

export default nextConfig;
