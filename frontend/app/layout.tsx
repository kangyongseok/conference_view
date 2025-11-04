import type { Metadata } from 'next';
import { Noto_Sans_KR, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: '컨퍼런스 비디오 | 개발 컨퍼런스 발표 영상 모음',
    template: '%s | 컨퍼런스 비디오',
  },
  description:
    'FEConf, NDC, if(kakao) 등 다양한 개발 컨퍼런스의 발표 영상을 연도, 컨퍼런스, 개발언어, 직군별로 필터링하여 볼 수 있습니다.',
  keywords: [
    '컨퍼런스',
    '개발 컨퍼런스',
    'FEConf',
    'NDC',
    '프론트엔드',
    '백엔드',
    '개발 발표',
    '프로그래밍',
  ],
  authors: [{ name: 'Conference View' }],
  creator: 'Conference View',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://conference-view.com',
    siteName: '컨퍼런스 비디오',
    title: '컨퍼런스 비디오 | 개발 컨퍼런스 발표 영상 모음',
    description:
      'FEConf, NDC, if(kakao) 등 다양한 개발 컨퍼런스의 발표 영상을 연도, 컨퍼런스, 개발언어, 직군별로 필터링하여 볼 수 있습니다.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '컨퍼런스 비디오',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '컨퍼런스 비디오 | 개발 컨퍼런스 발표 영상 모음',
    description:
      'FEConf, NDC, if(kakao) 등 다양한 개발 컨퍼런스의 발표 영상을 필터링하여 볼 수 있습니다.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://conference-view.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${notoSansKR.variable} ${outfit.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
