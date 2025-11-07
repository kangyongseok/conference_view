'use client';

import { createClient } from '../client';
import { cache } from '@/lib/cache/cache';
import type { Video, FilterOptions, PaginationOptions } from '../types';
import { applyFilters, applySorting } from './utils';
import { CACHE_TTL, PAGINATION } from '@/lib/constants';

// 비디오 목록 조회 (페이지네이션) - 캐싱 적용
export const fetchVideos = async (
  filters: FilterOptions = {},
  pagination: PaginationOptions = { page: 1, pageSize: PAGINATION.DEFAULT_PAGE_SIZE }
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

  // 캐시 저장
  cache.set(cacheKey, result, CACHE_TTL.VIDEOS);

  return result;
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

  // 캐시 저장
  if (data) {
    cache.set(cacheKey, data, CACHE_TTL.VIDEO_DETAIL);
  }

  return data;
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

  // 캐시 저장
  cache.set(cacheKey, result, CACHE_TTL.FILTER_OPTIONS);

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

