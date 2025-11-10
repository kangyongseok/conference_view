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
  metadataBase: new URL('https://conference-view.vercel.app'),
  title: {
    default: '테크 컨퍼런스 영상 모음 | FEConf, NDC, if(kakao) 발표 영상',
    template: '%s | 테크 컨퍼런스 영상',
  },
  description:
    'FEConf, NDC, if(kakao), 당근테크, 채널톡 등 국내 주요 테크 컨퍼런스 발표 영상을 연도, 컨퍼런스, 개발언어, 직군별로 필터링하여 무료로 시청하세요.',
  keywords: [
    '테크 컨퍼런스',
    '개발자 컨퍼런스',
    'FEConf',
    'FEConf 2024',
    'FEConf 2025',
    'NDC',
    'NDC 2024',
    'NDC 2025',
    'if kakao',
    'if(kakao)',
    '당근테크',
    '채널톡 컨퍼런스',
    '프론트엔드 컨퍼런스',
    '백엔드 컨퍼런스',
    '개발 발표 영상',
    '프로그래밍 컨퍼런스',
    '테크톡',
    '기술 컨퍼런스',
  ],
  authors: [{ name: 'Conference View' }],
  creator: 'Conference View',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://conference-view.vercel.app',
    siteName: '테크 컨퍼런스 영상',
    title: '테크 컨퍼런스 영상 모음 | FEConf, NDC, if(kakao) 발표 영상',
    description:
      'FEConf, NDC, if(kakao), 당근테크, 채널톡 등 국내 주요 테크 컨퍼런스 발표 영상을 연도, 컨퍼런스, 개발언어, 직군별로 필터링하여 무료로 시청하세요.',
    images: [
      {
        url: 'https://conference-view.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: '테크 컨퍼런스 영상 - FEConf, NDC, if(kakao)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '테크 컨퍼런스 영상 모음 | FEConf, NDC, if(kakao)',
    description:
      'FEConf, NDC, if(kakao), 당근테크, 채널톡 등 국내 주요 테크 컨퍼런스 발표 영상을 무료로 시청하세요.',
    images: ['https://conference-view.vercel.app/og-image.png'],
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
    canonical: 'https://conference-view.vercel.app',
    types: {
      'application/rss+xml': [{ url: '/sitemap.xml', title: 'Sitemap' }],
    },
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
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: '테크 컨퍼런스 영상',
              description:
                'FEConf, NDC, if(kakao) 등 국내 주요 테크 컨퍼런스 발표 영상 모음',
              url: 'https://conference-view.vercel.app',
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: {
                  '@type': 'ListItem',
                  position: 1,
                  name: '테크 컨퍼런스 영상 모음',
                },
              },
            }),
          }}
        />
        {clarityProjectId && !isDevelopment && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityProjectId}");
              `,
            }}
          />
        )}
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="naver-site-verification"
          content="baeb524cf7dbc8ae25b17f9e48b7c24ec171ac3b"
        />
        <meta
          name="google-site-verification"
          content="LdxUzJqenFfAbuY1sPp65G-xtO_J9CAw_L8hZPwogNs"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* OG 이미지 메타 태그 명시적 추가 */}
        <meta
          property="og:image"
          content="https://conference-view.vercel.app/og-image.png"
        />
        <meta
          property="og:image:secure_url"
          content="https://conference-view.vercel.app/og-image.png"
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="컨퍼런스 비디오" />

        {/* Twitter Card 이미지 */}
        <meta
          name="twitter:image"
          content="https://conference-view.vercel.app/og-image.png"
        />
        <meta
          name="twitter:image:src"
          content="https://conference-view.vercel.app/og-image.png"
        />

        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
