import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde la IP de red local
  // (p. ej. http://172.28.144.1:3000) además de localhost.
  allowedDevOrigins: ["172.28.144.1"],
};

export default nextConfig;
