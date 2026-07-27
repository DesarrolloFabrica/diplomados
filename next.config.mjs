/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necesario para el Dockerfile (Cloud Run): produce un servidor Node
  // autocontenido en .next/standalone.
  output: "standalone",
  images: {
    remotePatterns: [
      // Google Cloud Storage sirve las URLs firmadas de archivos privados.
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
