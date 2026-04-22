'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { BOOKMARK_VIEW_MODE_STORAGE_KEY } from '@/lib/constants';

export type BookmarkViewMode = 'grid' | 'list';

const isViewMode = (value: unknown): value is BookmarkViewMode =>
  value === 'grid' || value === 'list';

const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOOKMARK_VIEW_MODE_STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
};

const getSnapshot = (): BookmarkViewMode => {
  try {
    const stored = window.localStorage.getItem(BOOKMARK_VIEW_MODE_STORAGE_KEY);
    if (isViewMode(stored)) return stored;
  } catch {
    // localStorage 접근 실패 시 기본값
  }
  return 'grid';
};

const getServerSnapshot = (): BookmarkViewMode => 'grid';

export const useBookmarkViewMode = (): [
  BookmarkViewMode,
  (mode: BookmarkViewMode) => void,
] => {
  const viewMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setViewMode = useCallback((mode: BookmarkViewMode) => {
    try {
      window.localStorage.setItem(BOOKMARK_VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // 쓰기 실패는 무시
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [viewMode, setViewMode];
};
