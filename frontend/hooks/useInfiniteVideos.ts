import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchVideos,
  fetchFavoriteVideos, // 추가
  type Video,
  type FilterOptions,
  type PaginationOptions,
} from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';

interface UseInfiniteVideosOptions {
  filters: FilterOptions;
  pageSize?: number;
  enabled?: boolean;
  favoritesOnly?: boolean;
}

export const useInfiniteVideos = ({
  filters,
  pageSize = 20,
  enabled = true,
  favoritesOnly = false,
}: UseInfiniteVideosOptions) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const currentPageRef = useRef(1);
  const isLoadingRef = useRef(false);

  // 필터 변경 시 초기화
  useEffect(() => {
    setVideos([]);
    currentPageRef.current = 1;
    setHasMore(true);
    setError(null);
  }, [
    filters.year?.join(','),
    filters.conference?.join(','),
    filters.programmingLanguage?.join(','),
    filters.jobType?.join(','),
    filters.sortBy,
    favoritesOnly, // favoritesOnly 변경 시에도 초기화
    user?.id, // 사용자 변경 시에도 초기화
  ]);

  // 데이터 로드
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !hasMore) return;

    // favoritesOnly일 때는 user가 필수
    if (favoritesOnly && !user) {
      setError(new Error('로그인이 필요합니다.'));
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let result;

      if (favoritesOnly && user) {
        // 즐겨찾기만 조회 - 현재 로그인한 사용자의 즐겨찾기만
        result = await fetchFavoriteVideos(user.id, filters, {
          page: currentPageRef.current,
          pageSize,
        });
      } else {
        // 일반 비디오 조회
        result = await fetchVideos(filters, {
          page: currentPageRef.current,
          pageSize,
        });
      }

      // 중복 제거: youtube_id를 기준으로 중복 제거
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.youtube_id));
        const newVideos = result.data.filter(
          (v) => !existingIds.has(v.youtube_id)
        );
        return [...prev, ...newVideos];
      });

      setTotal(result.total);
      setHasMore(result.data.length === pageSize);
      currentPageRef.current += 1;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('데이터 로드 실패'));
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [filters, pageSize, enabled, hasMore, favoritesOnly, user]);

  // 초기 로드 및 필터 변경 시 자동 로드
  useEffect(() => {
    if (enabled && videos.length === 0 && !loading && hasMore) {
      // favoritesOnly일 때는 user가 있어야 로드
      if (favoritesOnly && !user) {
        return;
      }
      loadMore();
    }
  }, [enabled, videos.length, loading, hasMore, loadMore, favoritesOnly, user]);

  // 무한 스크롤 감지
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  return {
    videos,
    loading,
    hasMore,
    error,
    total,
    loadMore,
    lastElementRef,
  };
};
