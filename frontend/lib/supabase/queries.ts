import { createClient } from './client';
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

// 필터 적용 함수
const applyFilters = (query: any, filters: FilterOptions) => {
  let filteredQuery = query;

  // 연도 필터
  if (filters.year && filters.year.length > 0) {
    const years = filters.year.map((y) => parseInt(y));
    filteredQuery = filteredQuery.in('year', years);
  }

  // 컨퍼런스 필터
  if (filters.conference && filters.conference.length > 0) {
    filteredQuery = filteredQuery.in('conference_name', filters.conference);
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

// 비디오 목록 조회 (페이지네이션)
export const fetchVideos = async (
  filters: FilterOptions = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<{ data: Video[]; total: number }> => {
  const supabase = createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 필터 적용
  let query = supabase.from('videos').select('*', { count: 'exact' });

  query = applyFilters(query, filters);
  query = applySorting(query, filters.sortBy || 'newest');

  // 페이지네이션
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('비디오 조회 오류:', error);
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
  };
};

// 필터 옵션 조회 (동적 필터 목록)
export const fetchFilterOptions = async (): Promise<{
  years: string[];
  conferences: string[];
  languages: string[];
  jobTypes: string[];
}> => {
  const supabase = createClient();

  // 연도 목록
  const { data: yearData } = await supabase
    .from('videos')
    .select('year')
    .not('year', 'is', null);

  // 컨퍼런스 목록
  const { data: conferenceData } = await supabase
    .from('videos')
    .select('conference_name')
    .not('conference_name', 'is', null);

  // 개발언어 목록 (배열에서 추출)
  const { data: languageData } = await supabase
    .from('videos')
    .select('programming_languages')
    .not('programming_languages', 'is', null);

  // 직군 목록
  const { data: jobTypeData } = await supabase
    .from('videos')
    .select('job_type')
    .not('job_type', 'is', null);

  // 연도 정렬 및 중복 제거
  const years = Array.from(
    new Set(
      (yearData || [])
        .map((v) => v.year?.toString())
        .filter((y): y is string => y !== undefined)
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  // 컨퍼런스 정렬 및 중복 제거
  const conferences = Array.from(
    new Set(
      (conferenceData || [])
        .map((v) => v.conference_name)
        .filter((c): c is string => c !== null)
    )
  ).sort();

  // 개발언어 정렬 및 중복 제거 (배열 평탄화)
  const languages = Array.from(
    new Set(
      (languageData || [])
        .flatMap((v) => v.programming_languages || [])
        .filter((l): l is string => l !== null && l !== undefined)
    )
  ).sort();

  // 직군 정렬 및 중복 제거
  const jobTypes = Array.from(
    new Set(
      (jobTypeData || [])
        .map((v) => v.job_type)
        .filter((j): j is string => j !== null)
    )
  ).sort();

  return {
    years,
    conferences,
    languages,
    jobTypes,
  };
};

// 단일 비디오 조회
export const fetchVideoById = async (
  youtubeId: string
): Promise<Video | null> => {
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

// 즐겨찾기한 비디오 목록 조회 (페이지네이션)
export const fetchFavoriteVideos = async (
  userId: string,
  filters: FilterOptions = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<{ data: Video[]; total: number }> => {
  const supabase = createClient();
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 즐겨찾기 목록 조회 - 현재 사용자의 즐겨찾기만
  const { data: favorites, error: favoritesError } = await supabase
    .from('favorites')
    .select('youtube_id')
    .eq('user_id', userId); // 현재 로그인한 사용자 ID로 필터링

  if (favoritesError) {
    console.error('즐겨찾기 조회 오류:', favoritesError);
    throw favoritesError;
  }

  if (!favorites || favorites.length === 0) {
    return { data: [], total: 0 };
  }

  const youtubeIds = favorites.map((f) => f.youtube_id);

  // 비디오 조회 - 즐겨찾기한 youtube_id만
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

  return {
    data: data || [],
    total: count || 0,
  };
};
