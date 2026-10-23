import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 클라이언트 코드에서도 process.env.API_URL 을 사용할 수 있도록 빌드 시 주입한다.
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
