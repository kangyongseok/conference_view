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

