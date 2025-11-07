import { Metadata } from 'next';

// app/bookmarks/layout.tsx
export const metadata: Metadata = {
  title: '북마크',
  description:
    '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
  keywords: ['북마크', 'bookmark', '리소스 관리', '태그'],
  openGraph: {
    type: 'website', // 추가 필요
    title: '북마크 | 컨퍼런스 비디오',
    description:
      '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
    url: 'https://conference-view.com/bookmarks',
    images: [
      // 추가 필요
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '북마크 페이지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image', // summary에서 변경
    title: '북마크 | 컨퍼런스 비디오',
    description:
      '유용한 웹사이트와 리소스를 북마크로 저장하고 태그로 관리하세요.',
    images: ['/og-image.jpg'], // 추가 필요
  },
  robots: {
    // 추가 필요
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://conference-view.com/bookmarks',
  },
};
