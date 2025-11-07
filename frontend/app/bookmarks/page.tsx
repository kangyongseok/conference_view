'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/AuthButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bookmark, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  createBookmark,
  fetchBookmarks,
  updateBookmark,
  deleteBookmark,
  fetchUserTags,
  type Bookmark as BookmarkType,
} from '@/lib/supabase/queries';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';
import { TagSidebar } from '@/components/TagSidebar';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    logBookmarkAdd,
    logBookmarkDelete,
    logBookmarkTagUpdate,
    logBookmarkFilter,
  } = useAnalytics();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
          pageSize: 20,
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
        setHasMore(result.data.length === 20);
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
  }, [user, selectedTags.join(',')]); // selectedTags 변경 시 재로드

  // 태그 필터 변경 시 로그
  useEffect(() => {
    if (user && selectedTags.length > 0) {
      logBookmarkFilter(selectedTags);
    }
  }, [selectedTags, user, logBookmarkFilter]);

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

  // 북마크 추가 핸들러 (메모이제이션)
  const handleAddBookmark = useCallback(
    async (url: string, tags: string[]) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      setIsAdding(true);
      try {
        await createBookmark(user.id, url, tags);
        logBookmarkAdd(url, tags);
        await loadBookmarks(true);
        await loadTags();
      } catch (error) {
        // 에러를 다시 throw하여 BookmarkForm에서 처리하도록
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [user, loadBookmarks, loadTags, logBookmarkAdd]
  );

  // 북마크 삭제 핸들러 (메모이제이션)
  const handleDeleteBookmark = useCallback(
    async (bookmarkId: number) => {
      if (!confirm('북마크를 삭제하시겠습니까?')) return;

      try {
        const bookmark = bookmarks.find((b) => b.id === bookmarkId);
        await deleteBookmark(bookmarkId);
        if (bookmark) {
          logBookmarkDelete(bookmarkId, bookmark.url);
        }
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        setTotal((prev) => prev - 1);
        await loadTags();
      } catch (error) {
        console.error('북마크 삭제 실패:', error);
        alert('북마크 삭제에 실패했습니다.');
      }
    },
    [loadTags, bookmarks, logBookmarkDelete]
  );

  // 태그 업데이트 핸들러 (메모이제이션)
  const handleUpdateTags = useCallback(
    async (bookmarkId: number, newTags: string[]) => {
      try {
        await updateBookmark(bookmarkId, { tags: newTags });
        logBookmarkTagUpdate(bookmarkId, newTags);
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bookmarkId ? { ...b, tags: newTags } : b))
        );
        await loadTags();
      } catch (error) {
        console.error('태그 업데이트 실패:', error);
        alert('태그 업데이트에 실패했습니다.');
      }
    },
    [loadTags, logBookmarkTagUpdate]
  );

  // 태그 선택 핸들러 (메모이제이션)
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
  }, []);

  if (authLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="홈으로 돌아가기">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Bookmark className="h-6 w-6" />
              북마크
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton />
            <ThemeToggle />
          </div>
        </header>

        <div className="py-20 text-center">
          <Bookmark className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <p className="mb-2 text-lg text-muted-foreground">
            로그인이 필요합니다
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            북마크 기능을 사용하려면 로그인해주세요.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* 헤더 */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="홈으로 돌아가기">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Bookmark className="h-6 w-6" />
            북마크
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <AuthButton />
          <ThemeToggle />
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* 좌측: 태그 사이드바 */}
        <TagSidebar
          tags={allTags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          onClearFilters={handleClearFilters}
        />

        {/* 우측: 메인 콘텐츠 */}
        <main className="flex-1 min-w-0">
          {/* 북마크 추가 폼 */}
          <BookmarkForm
            allTags={allTags}
            onAddBookmark={handleAddBookmark}
            isAdding={isAdding}
          />

          {/* 북마크 목록 */}
          <BookmarkList
            bookmarks={bookmarks}
            allTags={allTags}
            loading={loading}
            hasMore={hasMore}
            total={total}
            selectedTags={selectedTags}
            onDelete={handleDeleteBookmark}
            onUpdateTags={handleUpdateTags}
            lastElementRef={lastElementRef}
          />
        </main>
      </div>
    </div>
  );
}
