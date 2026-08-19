import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@plataforma/backend"],
  // Raíz del monorepo para que standalone incluya backend/ en el trace.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Necesario para el Dockerfile (Cloud Run): produce un servidor Node
  // autocontenido en .next/standalone.
  output: "standalone",
  images: {
    remotePatterns: [
      // Google Cloud Storage sirve las URLs firmadas de archivos privados.
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
    localPatterns: [
      // Proxy interno de portadas almacenadas en Google Drive.
      { pathname: "/api/imagenes/google-drive" },
      // Assets estáticos del roadmap de aprendizaje (public/images/roadmap_asset).
      { pathname: "/images/roadmap_asset/**" },
    ],
  },
};

export default nextConfig;
