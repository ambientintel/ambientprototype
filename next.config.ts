import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/biodesign/digitalhealth',
        destination: '/digitalhealth',
        permanent: true,
      },
      {
        source: '/biodesign/digitalhealth/app',
        destination: '/digitalhealth/app',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
