import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // 캐시 최대 기간 설정 (31일 = 2678400초)
    minimumCacheTTL: 31536000,

    // 형식: AVIF 제거하고 WebP만 사용 (변환 횟수 절반으로 감소)
    formats: ['image/webp'],

    // 품질: 85만 사용 (변환 횟수 감소)
    // 필요시 75 추가 가능: [75, 85]

    // 이미지 크기 최적화 (변환 횟수 감소)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 원격 패턴 (이미 설정됨, 유지)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
    ],
  },
};

export default nextConfig;
