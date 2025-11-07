import type { Metadata } from 'next';
import { Noto_Sans_KR, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import Script from 'next/script';

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://conference-view.com'),
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
        url: 'https://conference-view.com/og-image.png',
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
    images: ['https://conference-view.com/og-image.png'],
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
  // 환경 변수는 서버 컴포넌트에서 직접 접근 (NEXT_PUBLIC_ 접두사는 클라이언트에서도 접근 가능)
  const GA_MEASUREMENT_ID =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '컨퍼런스 비디오',
              description: '개발 컨퍼런스 발표 영상 모음',
              url: 'https://conference-view.com',
              applicationCategory: 'EducationalApplication',
            }),
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="컨퍼런스 비디오" />

        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="컨퍼런스 비디오" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta
          property="og:image"
          content="https://conference-view.com/og-image.png"
        />
        <meta
          property="og:image:secure_url"
          content="https://conference-view.com/og-image.png"
        />
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && !isDevelopment && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
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
