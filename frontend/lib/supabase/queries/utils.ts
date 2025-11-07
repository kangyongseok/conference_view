import type { FilterOptions } from '../types';

// 필터 적용 함수
export const applyFilters = (query: any, filters: FilterOptions) => {
  let filteredQuery = query;

  // 연도 필터
  if (filters.year && filters.year.length > 0) {
    const years = filters.year.map((y) => parseInt(y));
    filteredQuery = filteredQuery.in('year', years);
  }

  // 컨퍼런스 필터 - channel_name 사용
  if (filters.conference && filters.conference.length > 0) {
    filteredQuery = filteredQuery.in('channel_name', filters.conference);
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
export const applySorting = (query: any, sortBy: FilterOptions['sortBy']) => {
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

