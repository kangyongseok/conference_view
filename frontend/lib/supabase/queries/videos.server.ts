import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Video } from '../types';

// 공개 데이터 조회용 anon 클라이언트 (cookies 미사용 → sitemap/generateMetadata 캐싱 가능)
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function fetchAllVideoIdsForSitemap(): Promise<
  { youtube_id: string; published_at: string | null }[]
> {
  const supabase = createPublicClient();
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 50; // sitemap URL 상한(50k) 방어
  const all: { youtube_id: string; published_at: string | null }[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('videos')
      .select('youtube_id, published_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error('sitemap 비디오 조회 오류:', error);
      throw error;
    }

    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return all;
}

export async function fetchVideoByIdServer(
  youtubeId: string
): Promise<Video | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_id', youtubeId)
    .maybeSingle();

  if (error) {
    console.error('비디오 서버 조회 오류:', error);
    throw error;
  }

  return data;
}
