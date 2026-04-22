'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useBookmarkViewMode } from '@/hooks/useBookmarkViewMode';
import { AuthButton } from '@/components/AuthButton';
import { Bookmark, Loader2 } from 'lucide-react';
import {
  BookmarkForm,
  BookmarkList,
  TagSidebar,
  ViewModeToggle,
} from '@/components/bookmark';
import { PageHeader, PageLayout } from '@/components/layout';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    logBookmarkAdd,
    logBookmarkDelete,
    logBookmarkTagUpdate,
    logBookmarkFilter,
  } = useAnalytics();

  const [viewMode, setViewMode] = useBookmarkViewMode();

  const {
    bookmarks,
    allTags,
    selectedTags,
    selectedCategory,
    loading,
    isAdding,
    total,
    hasMore,
    addBookmark,
    removeBookmark,
    updateBookmarkFields,
    selectTag,
    selectCategory,
    clearFilters,
    lastElementRef,
  } = useBookmarks();

  // 태그 필터 변경 시 로그
  useEffect(() => {
    if (user && selectedTags.length > 0) {
      logBookmarkFilter(selectedTags);
    }
  }, [selectedTags, user, logBookmarkFilter]);

  const handleAddBookmark = useCallback(
    async (url: string, tags: string[], category: string | null) => {
      try {
        await addBookmark(url, tags, category);
        logBookmarkAdd(url, tags);
      } catch (error) {
        throw error;
      }
    },
    [addBookmark, logBookmarkAdd]
  );

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

  const handleUpdateFields = useCallback(
    async (
      bookmarkId: number,
      updates: { tags?: string[]; category?: string | null }
    ) => {
      try {
        await updateBookmarkFields(bookmarkId, updates);
        if (updates.tags) {
          logBookmarkTagUpdate(bookmarkId, updates.tags);
        }
      } catch (error) {
        console.error('북마크 업데이트 실패:', error);
        alert('북마크 업데이트에 실패했습니다.');
      }
    },
    [updateBookmarkFields, logBookmarkTagUpdate]
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
          selectedCategory={selectedCategory}
          onTagSelect={selectTag}
          onCategorySelect={selectCategory}
          onClearFilters={clearFilters}
        />
      }
    >
      <PageHeader
        title="북마크"
        icon={<Bookmark className="h-6 w-6" />}
        showBackButton
      />

      <BookmarkForm
        allTags={allTags}
        onAddBookmark={handleAddBookmark}
        isAdding={isAdding}
      />

      <div className="mb-4 flex items-center justify-end">
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <BookmarkList
        bookmarks={bookmarks}
        allTags={allTags}
        loading={loading}
        hasMore={hasMore}
        total={total}
        selectedTags={selectedTags}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
        onDelete={handleDeleteBookmark}
        onUpdateFields={handleUpdateFields}
        onTagClick={selectTag}
        lastElementRef={lastElementRef}
      />
    </PageLayout>
  );
}
