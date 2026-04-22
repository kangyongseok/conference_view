import { MetadataRoute } from 'next';
import { fetchAllVideoIdsForSitemap } from '@/lib/supabase/queries/videos.server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://conference-view.vercel.app';

  let videoEntries: MetadataRoute.Sitemap = [];
  try {
    const videos = await fetchAllVideoIdsForSitemap();
    videoEntries = videos.map((v) => ({
      url: `${baseUrl}/videos/${v.youtube_id}`,
      lastModified: v.published_at ? new Date(v.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('sitemap 생성 중 비디오 목록 조회 실패:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...videoEntries,
  ];
}
