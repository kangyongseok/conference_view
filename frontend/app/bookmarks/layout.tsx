import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '북마크',
  description:
    '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
  keywords: ['북마크', 'bookmark', '리소스 관리', '태그'],
  openGraph: {
    type: 'website',
    title: '북마크 | 컨퍼런스 비디오',
    description:
      '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
    url: 'https://conference-view.vercel.app/bookmarks',
    // images 제거 - 루트의 기본 이미지 상속
  },
  twitter: {
    card: 'summary_large_image',
    title: '북마크 | 컨퍼런스 비디오',
    description:
      '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
    // images 제거 - 루트의 기본 이미지 상속
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://conference-view.vercel.app/bookmarks',
  },
};

// default export 추가 필요
export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
