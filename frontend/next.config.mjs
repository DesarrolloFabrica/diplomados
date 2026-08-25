import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

// DATABASE_URL y el resto de secretos viven en la raíz del monorepo.
const dotenv = require("dotenv");
dotenv.config({ path: path.join(monorepoRoot, ".env.local") });
dotenv.config({ path: path.join(monorepoRoot, ".env") });

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
