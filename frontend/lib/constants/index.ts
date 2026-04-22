// 페이지네이션 상수
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// 캐시 TTL (밀리초)
export const CACHE_TTL = {
  VIDEOS: 5 * 60 * 1000,        // 5분
  VIDEO_DETAIL: 10 * 60 * 1000, // 10분
  FILTER_OPTIONS: 30 * 60 * 1000, // 30분
  FAVORITES: 2 * 60 * 1000,     // 2분
  BOOKMARKS: 5 * 60 * 1000,     // 5분
  BOOKMARK_TAGS: 10 * 60 * 1000, // 10분
  VIDEO_NOTE: 10 * 60 * 1000,   // 10분
  VIDEO_NOTE_NULL: 1 * 60 * 1000, // 1분 (null 캐시)
} as const;

// 북마크 카테고리 (화이트리스트)
export const BOOKMARK_CATEGORIES = [
  '블로그',
  '영상',
  'JS',
  '리액트',
  '스타일',
  '기술공유',
  '백엔드',
  'AI/ML',
  '도구',
  '튜토리얼',
  '디자인',
  '오픈소스',
] as const;

export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number];

// 북마크 뷰 모드 localStorage 키
export const BOOKMARK_VIEW_MODE_STORAGE_KEY = 'bookmark-view-mode';

