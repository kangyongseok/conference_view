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

  // 개발언어 필터 (배열 포함 검색, 대소문자 무시)
  if (filters.programmingLanguage && filters.programmingLanguage.length > 0) {
    // 필터 옵션에서 가져온 값들을 그대로 사용 (이미 정규화되어 있음)
    // overlaps는 대소문자를 구분하므로, 필터 옵션과 데이터베이스 값이 일치해야 함
    // 필터 옵션 조회 시 이미 대소문자 정규화가 되어 있으므로 그대로 사용
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

