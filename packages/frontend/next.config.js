/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'arweave.net', 'via.placeholder.com'], // Common NFT hosting domains
  },
}

module.exports = nextConfig