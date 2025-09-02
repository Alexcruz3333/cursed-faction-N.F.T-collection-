/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'arweave.net'], // Common NFT hosting domains
  },
}

module.exports = nextConfig