'use client';

import { createClient } from '../client';
import { cache } from '@/lib/cache/cache';
import type { Bookmark } from '../types';
import { CACHE_TTL, PAGINATION } from '@/lib/constants';
import { handleSupabaseError } from '@/lib/utils/errors';

// oEmbed API로 메타데이터 가져오기
const fetchEmbedData = async (url: string) => {
  try {
    // Next.js API Route를 통해 서버사이드에서 처리
    const response = await fetch(
      `/api/bookmarks/embed?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error('메타데이터를 가져올 수 없습니다.');
    }

    const data = await response.json();

    return {
      title: data.title || null,
      description: data.description || null,
      thumbnail_url: data.thumbnail_url || null,
      html: data.html || null,
    };
  } catch (error) {
    console.error('Embed fetch error:', error);
    // 실패해도 기본 정보로 북마크 생성 가능
    return {
      title: null,
      description: null,
      thumbnail_url: null,
      html: null,
    };
  }
};

// 북마크 중복 체크
export const checkBookmarkExists = async (
  userId: string,
  url: string
): Promise<boolean> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('url', url)
    .maybeSingle();

  if (error) {
    console.error('북마크 중복 체크 실패:', error);
    return false;
  }

  return !!data;
};

// 북마크 생성 (캐싱 적용)
export const createBookmark = async (
  userId: string,
  url: string,
  tags: string[] = []
): Promise<Bookmark> => {
  const supabase = createClient();

  // 중복 체크
  const exists = await checkBookmarkExists(userId, url);
  if (exists) {
    throw new Error('이미 추가된 북마크입니다.');
  }

  // oEmbed API로 메타데이터 가져오기
  const embedData = await fetchEmbedData(url);

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      url,
      title: embedData.title || null,
      description: embedData.description || null,
      thumbnail_url: embedData.thumbnail_url || null,
      embed_html: embedData.html || null,
      tags: tags || [],
    })
    .select()
    .single();

  if (error) {
    throw handleSupabaseError(error, '북마크 생성에 실패했습니다.');
  }

  // 북마크 캐시 무효화
  cache.clearByPrefix('bookmarks:');
  cache.clearByPrefix('bookmark_tags:');

  return data;
};

// 북마크 목록 조회 (캐싱 적용)
export const fetchBookmarks = async (
  userId: string,
  options?: {
    tags?: string[];
    page?: number;
    pageSize?: number;
  }
): Promise<{ data: Bookmark[]; total: number }> => {
  // 캐시 키 생성
  const cacheKey = cache.generateKey('bookmarks', {
    userId,
    tags: options?.tags || [],
    page: options?.page || 1,
    pageSize: options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
  });

  // 캐시 확인
  const cached = cache.get<{ data: Bookmark[]; total: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createClient();

  let query = supabase
    .from('bookmarks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 태그 필터링 (OR 조건: 선택한 태그 중 하나라도 가진 북마크)
  if (options?.tags && options.tags.length > 0) {
    // overlaps를 사용하여 배열이 겹치는지 확인 (OR 조건)
    query = query.overlaps('tags', options.tags);
  }

  // 페이지네이션
  const page = options?.page || 1;
  const pageSize = options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw handleSupabaseError(error, '북마크 조회에 실패했습니다.');
  }

  const result = {
    data: data || [],
    total: count || 0,
  };

  // 캐시 저장
  cache.set(cacheKey, result, CACHE_TTL.BOOKMARKS);

  return result;
};

// 북마크 업데이트 (태그 수정)
export const updateBookmark = async (
  bookmarkId: number,
  updates: {
    tags?: string[];
    title?: string;
    description?: string;
  }
): Promise<Bookmark> => {
  const supabase = createClient();

  // 현재 세션의 사용자 ID 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('id', bookmarkId)
    .eq('user_id', user.id) // 현재 사용자 ID로 필터링
    .select()
    .single();

  if (error) {
    throw handleSupabaseError(error, '북마크 업데이트에 실패했습니다.');
  }

  // 북마크 캐시 무효화
  cache.clearByPrefix('bookmarks:');
  cache.clearByPrefix('bookmark_tags:');

  return data;
};

// 북마크 삭제
export const deleteBookmark = async (bookmarkId: number): Promise<void> => {
  const supabase = createClient();

  // 현재 세션의 사용자 ID 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id); // 현재 사용자 ID로 필터링

  if (error) {
    throw handleSupabaseError(error, '북마크 삭제에 실패했습니다.');
  }

  // 북마크 캐시 무효화
  cache.clearByPrefix('bookmarks:');
  cache.clearByPrefix('bookmark_tags:');
};

// 사용자의 모든 태그 조회 (캐싱 적용)
export const fetchUserTags = async (userId: string): Promise<string[]> => {
  // 캐시 키 생성
  const cacheKey = `bookmark_tags:${userId}`;

  // 캐시 확인
  const cached = cache.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('tags')
    .eq('user_id', userId);

  if (error) {
    throw handleSupabaseError(error, '태그 조회에 실패했습니다.');
  }

  // 모든 태그를 평탄화하고 중복 제거
  const allTags = new Set<string>();
  data?.forEach((bookmark) => {
    bookmark.tags?.forEach((tag: string) => allTags.add(tag));
  });

  const result = Array.from(allTags).sort();

  // 캐시 저장
  cache.set(cacheKey, result, CACHE_TTL.BOOKMARK_TAGS);

  return result;
};
