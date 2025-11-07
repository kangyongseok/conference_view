'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookmarks } from '@/hooks/useBookmarks';
import { AuthButton } from '@/components/AuthButton';
import { Bookmark, Loader2 } from 'lucide-react';
import type { Bookmark as BookmarkType } from '@/lib/supabase';
import { BookmarkForm, BookmarkList, TagSidebar } from '@/components/bookmark';
import { PageHeader, PageLayout } from '@/components/layout';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    logBookmarkAdd,
    logBookmarkDelete,
    logBookmarkTagUpdate,
    logBookmarkFilter,
  } = useAnalytics();

  // useBookmarks 훅 사용
  const {
    bookmarks,
    allTags,
    selectedTags,
    loading,
    isAdding,
    total,
    hasMore,
    addBookmark,
    removeBookmark,
    updateTags,
    selectTag,
    clearFilters,
    lastElementRef,
  } = useBookmarks();

  // 태그 필터 변경 시 로그
  useEffect(() => {
    if (user && selectedTags.length > 0) {
      logBookmarkFilter(selectedTags);
    }
  }, [selectedTags, user, logBookmarkFilter]);

  // 북마크 추가 핸들러 (애널리틱스 로깅 추가)
  const handleAddBookmark = useCallback(
    async (url: string, tags: string[]) => {
      try {
        await addBookmark(url, tags);
        logBookmarkAdd(url, tags);
      } catch (error) {
        // 에러를 다시 throw하여 BookmarkForm에서 처리하도록
        throw error;
      }
    },
    [addBookmark, logBookmarkAdd]
  );

  // 북마크 삭제 핸들러 (애널리틱스 로깅 추가)
  const handleDeleteBookmark = useCallback(
    async (bookmarkId: number) => {
      if (!confirm('북마크를 삭제하시겠습니까?')) return;

      try {
        const bookmark = bookmarks.find((b) => b.id === bookmarkId);
        await removeBookmark(bookmarkId);
        if (bookmark) {
          logBookmarkDelete(bookmarkId, bookmark.url);
        }
      } catch (error) {
        console.error('북마크 삭제 실패:', error);
        alert('북마크 삭제에 실패했습니다.');
      }
    },
    [removeBookmark, bookmarks, logBookmarkDelete]
  );

  // 태그 업데이트 핸들러 (애널리틱스 로깅 추가)
  const handleUpdateTags = useCallback(
    async (bookmarkId: number, newTags: string[]) => {
      try {
        await updateTags(bookmarkId, newTags);
        logBookmarkTagUpdate(bookmarkId, newTags);
      } catch (error) {
        console.error('태그 업데이트 실패:', error);
        alert('태그 업데이트에 실패했습니다.');
      }
    },
    [updateTags, logBookmarkTagUpdate]
  );

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
      <PageLayout>
        <PageHeader
          title="북마크"
          icon={<Bookmark className="h-6 w-6" />}
          showBackButton
        />
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
      </PageLayout>
    );
  }

  return (
    <PageLayout
      sidebar={
        <TagSidebar
          tags={allTags}
          selectedTags={selectedTags}
          onTagSelect={selectTag}
          onClearFilters={clearFilters}
        />
      }
    >
      <PageHeader
        title="북마크"
        icon={<Bookmark className="h-6 w-6" />}
        showBackButton
      />

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
    </PageLayout>
  );
}
