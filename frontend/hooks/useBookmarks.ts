import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchBookmarks,
  fetchUserTags,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  type Bookmark,
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PAGINATION } from '@/lib/constants';

interface UseBookmarksOptions {
  initialTags?: string[];
}

export const useBookmarks = (options: UseBookmarksOptions = {}) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    options.initialTags || []
  );
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);

  // 북마크 로드 (무한 스크롤용)
  const loadBookmarks = useCallback(
    async (reset = false) => {
      if (!user || isLoadingRef.current) return;

      if (reset) {
        setBookmarks([]);
        setPage(1);
        setHasMore(true);
      }

      if (!hasMore && !reset) return;

      isLoadingRef.current = true;
      setLoading(true);

      try {
        const currentPage = reset ? 1 : page;
        const result = await fetchBookmarks(user.id, {
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          page: currentPage,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        });

        if (reset) {
          setBookmarks(result.data);
        } else {
          setBookmarks((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            const newBookmarks = result.data.filter(
              (b) => !existingIds.has(b.id)
            );
            return [...prev, ...newBookmarks];
          });
        }

        setTotal(result.total);
        setHasMore(result.data.length === PAGINATION.DEFAULT_PAGE_SIZE);
        if (!reset) {
          setPage((prev) => prev + 1);
        }
      } catch (error) {
        console.error('북마크 로드 실패:', error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [user, selectedTags, page, hasMore]
  );

  // 태그 로드
  const loadTags = useCallback(async () => {
    if (!user) return;

    try {
      const userTags = await fetchUserTags(user.id);
      setAllTags(userTags);
    } catch (error) {
      console.error('태그 로드 실패:', error);
    }
  }, [user]);

  // 필터 변경 시 초기화 및 재로드
  useEffect(() => {
    if (user) {
      loadBookmarks(true);
      loadTags();
    }
  }, [user, selectedTags.join(',')]);

  // 북마크 추가
  const addBookmark = useCallback(
    async (url: string, tags: string[]) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      setIsAdding(true);
      try {
        await createBookmark(user.id, url, tags);
        await loadBookmarks(true);
        await loadTags();
      } catch (error) {
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [user, loadBookmarks, loadTags]
  );

  // 북마크 삭제
  const removeBookmark = useCallback(
    async (bookmarkId: number) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      try {
        await deleteBookmark(bookmarkId);
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        setTotal((prev) => prev - 1);
        await loadTags();
      } catch (error) {
        console.error('북마크 삭제 실패:', error);
        throw error;
      }
    },
    [user, loadTags]
  );

  // 태그 업데이트
  const updateTags = useCallback(
    async (bookmarkId: number, newTags: string[]) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      try {
        await updateBookmark(bookmarkId, { tags: newTags });
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bookmarkId ? { ...b, tags: newTags } : b))
        );
        await loadTags();
      } catch (error) {
        console.error('태그 업데이트 실패:', error);
        throw error;
      }
    },
    [user, loadTags]
  );

  // 태그 선택
  const selectTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // 무한 스크롤 감지
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadBookmarks(false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadBookmarks]
  );

  return {
    bookmarks,
    allTags,
    selectedTags,
    loading,
    isAdding,
    total,
    hasMore,
    loadBookmarks,
    loadTags,
    addBookmark,
    removeBookmark,
    updateTags,
    selectTag,
    clearFilters,
    lastElementRef,
  };
};
