import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '즐겨찾기',
  description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
  keywords: ['즐겨찾기', 'favorites', '관심 영상', '북마크'],
  openGraph: {
    title: '즐겨찾기 | 컨퍼런스 비디오',
    description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
    url: 'https://conference-view.com/favorites',
  },
  twitter: {
    card: 'summary',
    title: '즐겨찾기 | 컨퍼런스 비디오',
    description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
  },
  alternates: {
    canonical: 'https://conference-view.com/favorites',
  },
  robots: {
    index: false, // 로그인 필요 페이지는 인덱싱 제외 고려
    follow: true,
  },
};
