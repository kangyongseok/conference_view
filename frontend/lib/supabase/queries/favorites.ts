'use client';

import { createClient } from '../client';
import { cache } from '@/lib/cache/cache';
import type { Favorite, Video, FilterOptions, PaginationOptions } from '../types';
import { applyFilters, applySorting } from './utils';
import { CACHE_TTL, PAGINATION } from '@/lib/constants';

// 즐겨찾기 추가
export const addFavorite = async (
  userId: string,
  youtubeId: string
): Promise<Favorite> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      youtube_id: youtubeId,
    })
    .select()
    .single();

  if (error) {
    console.error('즐겨찾기 추가 오류:', error);
    throw error;
  }

  return data;
};

// 즐겨찾기 삭제
export const removeFavorite = async (
  userId: string,
  youtubeId: string
): Promise<void> => {
  const supabase = createClient();

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('youtube_id', youtubeId);

  if (error) {
    console.error('즐겨찾기 삭제 오류:', error);
    throw error;
  }
};

// 사용자의 즐겨찾기 목록 조회
export const fetchUserFavorites = async (
  userId: string
): Promise<Favorite[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('즐겨찾기 조회 오류:', error);
    throw error;
  }

  return data || [];
};

// 즐겨찾기 여부 확인
export const checkIsFavorite = async (
  userId: string,
  youtubeId: string
): Promise<boolean> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('youtube_id', youtubeId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116은 데이터가 없을 때 발생하는 코드
    console.error('즐겨찾기 확인 오류:', error);
    return false;
  }

  return !!data;
};

// 즐겨찾기한 비디오 목록 조회 - 캐싱 적용 (짧은 TTL, 사용자별)
export const fetchFavoriteVideos = async (
  userId: string,
  filters: FilterOptions = {},
  pagination: PaginationOptions = { page: 1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE }
): Promise<{ data: Video[]; total: number }> => {
  // 사용자별 캐시 키
  const cacheKey = cache.generateKey(`favorites:${userId}`, {
    filters,
    pagination,
  });

  const cached = cache.get<{ data: Video[]; total: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: favorites, error: favoritesError } = await supabase
    .from('favorites')
    .select('youtube_id')
    .eq('user_id', userId);

  if (favoritesError) {
    console.error('즐겨찾기 조회 오류:', favoritesError);
    throw favoritesError;
  }

  if (!favorites || favorites.length === 0) {
    return { data: [], total: 0 };
  }

  const youtubeIds = favorites.map((f) => f.youtube_id);

  let query = supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .in('youtube_id', youtubeIds);

  query = applyFilters(query, filters);
  query = applySorting(query, filters.sortBy || 'newest');

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('비디오 조회 오류:', error);
    throw error;
  }

  const result = {
    data: data || [],
    total: count || 0,
  };

  // 캐시 저장
  cache.set(cacheKey, result, CACHE_TTL.FAVORITES);

  return result;
};

// 즐겨찾기 추가/제거 시 캐시 무효화 함수
export const invalidateFavoriteCache = (userId: string): void => {
  cache.clearByPrefix(`favorites:${userId}`);
};

