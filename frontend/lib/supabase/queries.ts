'use client';

import { createClient } from './client';
import { cache } from '@/lib/cache/cache';
// import type { PostgrestFilterBuilder } from '@supabase/supabase-js';

export interface Video {
  id: number;
  youtube_id: string;
  thumbnail_url: string | null;
  title: string;
  conference_name: string | null;
  published_at: string | null;
  description: string | null;
  video_url: string | null;
  programming_languages: string[] | null;
  job_type: string | null;
  year: number | null;
  speaker_name: string | null;
  speaker_org: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  channel_name: string | null;
  tags: string[] | null;
}

export interface FilterOptions {
  year?: string[];
  conference?: string[];
  programmingLanguage?: string[];
  jobType?: string[];
  sortBy?: 'newest' | 'oldest' | 'title';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface Favorite {
  id: number;
  user_id: string;
  youtube_id: string;
  created_at: string;
  updated_at: string;
}

export interface VideoNote {
  id: number;
  user_id: string;
  youtube_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 필터 적용 함수
const applyFilters = (query: any, filters: FilterOptions) => {
  let filteredQuery = query;

  // 연도 필터
  if (filters.year && filters.year.length > 0) {
    const years = filters.year.map((y) => parseInt(y));
    filteredQuery = filteredQuery.in('year', years);
  }

  // 컨퍼런스 필터 - channel_name 사용
  if (filters.conference && filters.conference.length > 0) {
    filteredQuery = filteredQuery.in('channel_name', filters.conference); // 👈 conference_name → channel_name 변경
  }

  // 개발언어 필터 (배열 포함 검색)
  if (filters.programmingLanguage && filters.programmingLanguage.length > 0) {
    filteredQuery = filteredQuery.overlaps(
      'programming_languages',
      filters.programmingLanguage
    );
  }

  // 직군 필터
  if (filters.jobType && filters.jobType.length > 0) {
    filteredQuery = filteredQuery.in('job_type', filters.jobType);
  }

  return filteredQuery;
};

// 정렬 적용 함수
const applySorting = (query: any, sortBy: FilterOptions['sortBy']) => {
  switch (sortBy) {
    case 'newest':
      return query.order('published_at', {
        ascending: false,
        nullsFirst: false,
      });
    case 'oldest':
      return query.order('published_at', {
        ascending: true,
        nullsFirst: false,
      });
    case 'title':
      return query.order('title', { ascending: true });
    default:
      return query.order('published_at', {
        ascending: false,
        nullsFirst: false,
      });
  }
};

// 비디오 목록 조회 (페이지네이션) - 캐싱 적용
export const fetchVideos = async (
  filters: FilterOptions = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<{ data: Video[]; total: number }> => {
  // 캐시 키 생성
  const cacheKey = cache.generateKey('videos', { filters, pagination });

  // 캐시 확인
  const cached = cache.get<{ data: Video[]; total: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  // 캐시 미스 - 실제 쿼리 실행
  const supabase = createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('videos').select('*', { count: 'exact' });

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

  // 캐시 저장 (5분 TTL)
  cache.set(cacheKey, result, 5 * 60 * 1000);

  return result;
};

// 필터 옵션 조회 - 별도 테이블에서 조회
export const fetchFilterOptions = async (): Promise<{
  years: string[];
  conferences: string[];
  languages: string[];
  jobTypes: string[];
}> => {
  const cacheKey = 'filterOptions';

  // 캐시 확인
  const cached = cache.get<{
    years: string[];
    conferences: string[];
    languages: string[];
    jobTypes: string[];
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  // 캐시 미스 - 실제 쿼리 실행
  const supabase = createClient();

  // 필터 옵션 테이블에서 조회
  const { data: filterOptions, error } = await supabase
    .from('filter_options')
    .select('type, value, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('value', { ascending: true });

  if (error) {
    console.error('필터 옵션 조회 오류:', error);
    throw error;
  }

  // 타입별로 분류
  const years: string[] = [];
  const conferences: string[] = [];
  const languages: string[] = [];
  const jobTypes: string[] = [];

  (filterOptions || []).forEach((option) => {
    switch (option.type) {
      case 'year':
        years.push(option.value);
        break;
      case 'conference':
        conferences.push(option.value);
        break;
      case 'programming_language':
        languages.push(option.value);
        break;
      case 'job_type':
        jobTypes.push(option.value);
        break;
    }
  });

  const result = {
    years,
    conferences,
    languages,
    jobTypes,
  };

  // 캐시 저장 (30분 TTL)
  cache.set(cacheKey, result, 30 * 60 * 1000);

  return result;
};

// 필터 옵션 추가 (관리자용)
export const addFilterOption = async (
  type: 'conference' | 'programming_language' | 'job_type' | 'year',
  value: string,
  displayOrder: number = 0
): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase.from('filter_options').insert([
    {
      type,
      value,
      display_order: displayOrder,
      is_active: true,
    },
  ]);

  if (error) {
    console.error('필터 옵션 추가 오류:', error);
    throw error;
  }

  // 캐시 무효화
  cache.delete('filterOptions');
};

// 필터 옵션 삭제 (관리자용)
export const deleteFilterOption = async (
  type: 'conference' | 'programming_language' | 'job_type' | 'year',
  value: string
): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('filter_options')
    .delete()
    .eq('type', type)
    .eq('value', value);

  if (error) {
    console.error('필터 옵션 삭제 오류:', error);
    throw error;
  }

  // 캐시 무효화
  cache.delete('filterOptions');
};

// 필터 옵션 업데이트 (관리자용)
export const updateFilterOption = async (
  type: 'conference' | 'programming_language' | 'job_type' | 'year',
  oldValue: string,
  newValue: string,
  displayOrder?: number,
  isActive?: boolean
): Promise<void> => {
  const supabase = createClient();
  const updateData: any = { value: newValue };

  if (displayOrder !== undefined) {
    updateData.display_order = displayOrder;
  }

  if (isActive !== undefined) {
    updateData.is_active = isActive;
  }

  const { error } = await supabase
    .from('filter_options')
    .update(updateData)
    .eq('type', type)
    .eq('value', oldValue);

  if (error) {
    console.error('필터 옵션 업데이트 오류:', error);
    throw error;
  }

  // 캐시 무효화
  cache.delete('filterOptions');
};

// 필터 옵션 동기화 (videos 테이블에서 최신 데이터로 업데이트)
export const syncFilterOptionsFromVideos = async (): Promise<void> => {
  const supabase = createClient();

  // 컨퍼런스 동기화
  const { data: conferenceData } = await supabase
    .from('videos')
    .select('conference_name, channel_name');

  const conferences = Array.from(
    new Set(
      (conferenceData || [])
        .map((v) => v.conference_name || v.channel_name)
        .filter((c): c is string => c !== null && c !== undefined)
    )
  );

  // 기존 데이터 삭제 후 재삽입
  await supabase.from('filter_options').delete().eq('type', 'conference');

  await supabase.from('filter_options').insert(
    conferences.map((conf) => ({
      type: 'conference',
      value: conf,
      display_order: 0,
      is_active: true,
    }))
  );

  // 연도 동기화
  const { data: yearData } = await supabase
    .from('videos')
    .select('year')
    .not('year', 'is', null);

  const years = Array.from(
    new Set(
      (yearData || [])
        .map((v) => v.year?.toString())
        .filter((y): y is string => y !== undefined)
    )
  )
    .map((y) => parseInt(y))
    .sort((a, b) => b - a);

  await supabase.from('filter_options').delete().eq('type', 'year');

  await supabase.from('filter_options').insert(
    years.map((year, index) => ({
      type: 'year',
      value: year.toString(),
      display_order: index + 1,
      is_active: true,
    }))
  );

  // 개발언어 동기화
  const { data: languageData } = await supabase
    .from('videos')
    .select('programming_languages')
    .not('programming_languages', 'is', null);

  const languages = Array.from(
    new Set(
      (languageData || [])
        .flatMap((v) => v.programming_languages || [])
        .filter((l): l is string => l !== null && l !== undefined)
    )
  ).sort();

  await supabase
    .from('filter_options')
    .delete()
    .eq('type', 'programming_language');

  await supabase.from('filter_options').insert(
    languages.map((lang) => ({
      type: 'programming_language',
      value: lang,
      display_order: 0,
      is_active: true,
    }))
  );

  // 직군 동기화
  const { data: jobTypeData } = await supabase
    .from('videos')
    .select('job_type')
    .not('job_type', 'is', null);

  const jobTypes = Array.from(
    new Set(
      (jobTypeData || [])
        .map((v) => v.job_type)
        .filter((j): j is string => j !== null)
    )
  ).sort();

  await supabase.from('filter_options').delete().eq('type', 'job_type');

  await supabase.from('filter_options').insert(
    jobTypes.map((jobType) => ({
      type: 'job_type',
      value: jobType,
      display_order: 0,
      is_active: true,
    }))
  );

  // 캐시 무효화
  cache.delete('filterOptions');
};

// 단일 비디오 조회 - 캐싱 적용
export const fetchVideoById = async (
  youtubeId: string
): Promise<Video | null> => {
  const cacheKey = cache.generateKey('video', { youtubeId });

  const cached = cache.get<Video>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('youtube_id', youtubeId)
    .single();

  if (error) {
    console.error('비디오 조회 오류:', error);
    return null;
  }

  // 캐시 저장 (10분 TTL)
  if (data) {
    cache.set(cacheKey, data, 10 * 60 * 1000);
  }

  return data;
};

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
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
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

  // 캐시 저장 (2분 TTL - 즐겨찾기는 자주 변경될 수 있음)
  cache.set(cacheKey, result, 2 * 60 * 1000);

  return result;
};

// 즐겨찾기 추가/제거 시 캐시 무효화 함수
export const invalidateFavoriteCache = (userId: string): void => {
  cache.clearByPrefix(`favorites:${userId}`);
};

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
      cache.set(cacheKey, null, 1 * 60 * 1000); // 1분
      return null;
    }
    console.error('메모 조회 오류:', error);
    throw error;
  }

  // 캐시 저장 (10분 TTL)
  if (data) {
    cache.set(cacheKey, data, 10 * 60 * 1000);
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
  cache.set(cacheKey, result, 10 * 60 * 1000);

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
