import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@zama-fhe/relayer-sdk', 'fhevmjs'],
  productionBrowserSourceMaps: false,
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
  turbopack: {
    root: "./",
  }
};

export default nextConfig;
