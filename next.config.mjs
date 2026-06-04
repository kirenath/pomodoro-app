/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build a self-contained server bundle for easy `npm start` / containerized deploys.
  output: 'standalone',
  // No user-uploaded images in this app; disable /_next/image to avoid disk-exhaustion DoS.
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
