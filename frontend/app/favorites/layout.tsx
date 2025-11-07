import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '즐겨찾기',
  description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
  keywords: ['즐겨찾기', 'favorites', '관심 영상', '북마크'],
  openGraph: {
    title: '즐겨찾기 | 컨퍼런스 비디오',
    description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
    url: 'https://conference-view.vercel.app/favorites',
  },
  twitter: {
    card: 'summary_large_image', // summary에서 변경
    title: '즐겨찾기 | 컨퍼런스 비디오',
    description: '관심 있는 컨퍼런스 발표 영상을 즐겨찾기로 모아서 보세요.',
  },
  alternates: {
    canonical: 'https://conference-view.vercel.app/favorites',
  },
  robots: {
    index: false,
    follow: true,
  },
};

// default export 추가 필요
export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
