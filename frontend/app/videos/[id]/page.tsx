import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchVideoByIdServer } from '@/lib/supabase/queries/videos.server';
import VideoPageClient from './VideoPageClient';

type Props = { params: Promise<{ id: string }> };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://conference-view.vercel.app';

function buildThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await fetchVideoByIdServer(id);

  if (!video) {
    return {
      title: '비디오를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `${SITE_URL}/videos/${video.youtube_id}`;
  const thumbnail = buildThumbnail(video.youtube_id);
  const descriptionSource =
    video.description?.trim() ||
    [video.conference_name, video.speaker_name, video.title]
      .filter(Boolean)
      .join(' · ');
  const description = descriptionSource.slice(0, 160);

  const titleParts = [video.title];
  if (video.conference_name) titleParts.push(video.conference_name);
  const title = titleParts.join(' - ');

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'video.other',
      url: canonical,
      title: video.title,
      description,
      images: [
        {
          url: thumbnail,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
      videos: [
        {
          url: `https://www.youtube.com/embed/${video.youtube_id}`,
          type: 'text/html',
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: 'player',
      title: video.title,
      description,
      images: [thumbnail],
    },
  };
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  const video = await fetchVideoByIdServer(id);

  if (!video) {
    notFound();
  }

  const thumbnail = buildThumbnail(video.youtube_id);
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description?.trim() || video.title,
    thumbnailUrl: [thumbnail],
    embedUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
    inLanguage: 'ko',
  };

  if (video.published_at) {
    jsonLd.uploadDate = video.published_at;
  }
  if (video.duration) {
    jsonLd.duration = `PT${Math.max(1, Math.round(video.duration))}S`;
  }
  if (video.conference_name) {
    jsonLd.publisher = {
      '@type': 'Organization',
      name: video.conference_name,
    };
  }
  if (video.speaker_name) {
    jsonLd.author = {
      '@type': 'Person',
      name: video.speaker_name,
      ...(video.speaker_org && { affiliation: video.speaker_org }),
    };
  }
  if (video.view_count != null) {
    jsonLd.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.view_count,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VideoPageClient video={video} />
    </>
  );
}
