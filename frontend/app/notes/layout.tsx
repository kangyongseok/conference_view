import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 메모',
  description: '작성한 비디오 메모를 모아서 볼 수 있습니다.',
  keywords: ['메모', 'notes', '비디오 메모'],
  openGraph: {
    type: 'website',
    title: '내 메모 | 컨퍼런스 비디오',
    description: '작성한 비디오 메모를 모아서 볼 수 있습니다.',
    url: 'https://conference-view.vercel.app/notes',
  },
  twitter: {
    card: 'summary_large_image',
    title: '내 메모 | 컨퍼런스 비디오',
    description: '작성한 비디오 메모를 모아서 볼 수 있습니다.',
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://conference-view.vercel.app/notes',
  },
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
