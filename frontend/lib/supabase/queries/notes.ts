'use client';

import { createClient } from '../client';
import { cache } from '@/lib/cache/cache';
import type { Video, VideoNote } from '../types';
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

// 사용자의 모든 메모 조회 (비디오 정보 포함)
export const fetchUserNotes = async (
  userId: string
): Promise<Array<VideoNote & { video: Video | null }>> => {
  const supabase = createClient();

  // 1. 먼저 사용자의 모든 메모 조회
  const { data: notes, error: notesError } = await supabase
    .from('video_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (notesError) {
    console.error('메모 목록 조회 오류:', notesError);
    throw notesError;
  }

  if (!notes || notes.length === 0) {
    return [];
  }

  // 2. 고유한 youtube_id 목록 추출
  const youtubeIds = Array.from(
    new Set(notes.map((note) => note.youtube_id))
  ).filter((id): id is string => id !== null && id !== undefined);

  if (youtubeIds.length === 0) {
    return notes.map((note) => ({ ...note, video: null }));
  }

  // 3. 모든 비디오 정보를 한 번에 조회
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .in('youtube_id', youtubeIds);

  if (videosError) {
    console.error('비디오 정보 조회 오류:', videosError);
    // 비디오 조회 실패해도 메모는 반환
  }

  // 4. youtube_id를 키로 하는 비디오 맵 생성
  const videoMap = new Map<string, Video>();
  (videos || []).forEach((video) => {
    videoMap.set(video.youtube_id, video);
  });

  // 5. 메모와 비디오 정보 결합
  return notes.map((note) => ({
    ...note,
    video: videoMap.get(note.youtube_id) || null,
  }));
};
