/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // experimental: {
  //   instrumentationHook: true,
  // },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // скрываем ворнинги "Critical dependency: the request of a dependency is an expression"
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /typeorm/ },
      ];
    }
    if (!isServer) {
      // ⬇️ всё, что специфично для браузера
      config.resolve = config.resolve || {};

      // 1) заглушка для react-native-sqlite-storage (на всякий случай)
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        "react-native-sqlite-storage": false,
      };

      // 2) главное: alias "typeorm" на пустой модуль
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        typeorm: path.resolve(__dirname, "lib/typeorm-browser-stub.ts"),
      };
    }
    return config;
  },
  // productionBrowserSourceMaps: true,
};

// module.exports = nextConfig;

export default nextConfig;
