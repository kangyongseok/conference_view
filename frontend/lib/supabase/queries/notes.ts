'use client';

import { createClient } from '../client';
import { cache } from '@/lib/cache/cache';
import type { VideoNote } from '../types';
import { CACHE_TTL } from '@/lib/constants';

// 메모 조회 - 캐싱 적용
export const fetchVideoNote = async (
  userId: string,
  youtubeId: string
): Promise<VideoNote | null> => {
  // 캐시 키 생성
  const cacheKey = cache.generateKey('video_note', { userId, youtubeId });

  // 캐시 확인
  const cached = cache.get<VideoNote | null>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('video_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('youtube_id', youtubeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 메모가 없는 경우 - null도 캐시에 저장 (짧은 TTL)
      cache.set(cacheKey, null, CACHE_TTL.VIDEO_NOTE_NULL);
      return null;
    }
    console.error('메모 조회 오류:', error);
    throw error;
  }

  // 캐시 저장
  if (data) {
    cache.set(cacheKey, data, CACHE_TTL.VIDEO_NOTE);
  }

  return data;
};

// 메모 저장 (생성 또는 업데이트)
export const saveVideoNote = async (
  userId: string,
  youtubeId: string,
  content: string
): Promise<VideoNote> => {
  const supabase = createClient();

  // 기존 메모 확인
  const existing = await fetchVideoNote(userId, youtubeId);

  let result: VideoNote;

  if (existing) {
    // 업데이트
    const { data, error } = await supabase
      .from('video_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('메모 업데이트 오류:', error);
      throw error;
    }

    result = data;
  } else {
    // 생성
    const { data, error } = await supabase
      .from('video_notes')
      .insert({
        user_id: userId,
        youtube_id: youtubeId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('메모 생성 오류:', error);
      throw error;
    }

    result = data;
  }

  // 캐시 무효화 및 업데이트
  const cacheKey = cache.generateKey('video_note', { userId, youtubeId });
  cache.set(cacheKey, result, CACHE_TTL.VIDEO_NOTE);

  return result;
};

// 메모 삭제
export const deleteVideoNote = async (
  userId: string,
  youtubeId: string
): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('video_notes')
    .delete()
    .eq('user_id', userId)
    .eq('youtube_id', youtubeId);

  if (error) {
    console.error('메모 삭제 오류:', error);
    throw error;
  }

  // 캐시 무효화
  const cacheKey = cache.generateKey('video_note', { userId, youtubeId });
  cache.delete(cacheKey);
};

