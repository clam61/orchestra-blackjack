/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'deckofcardsapi.com',
            port: '',
            pathname: '/static/**',
          },
        ],
      },
};

export default nextConfig;
