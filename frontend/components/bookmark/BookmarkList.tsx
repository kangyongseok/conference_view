'use client';

import { memo } from 'react';
import { Loader2, Bookmark } from 'lucide-react';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark as BookmarkType } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { BookmarkViewMode } from '@/hooks/useBookmarkViewMode';

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  allTags: string[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  selectedTags: string[];
  selectedCategory: string | null;
  viewMode: BookmarkViewMode;
  onDelete: (id: number) => void;
  onUpdateFields: (
    id: number,
    updates: { tags?: string[]; category?: string | null }
  ) => void;
  onTagClick: (tag: string) => void;
  lastElementRef?: (node: HTMLElement | null) => void;
}

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  allTags,
  loading,
  hasMore,
  total,
  selectedTags,
  selectedCategory,
  viewMode,
  onDelete,
  onUpdateFields,
  onTagClick,
  lastElementRef,
}: BookmarkListProps) {
  if (loading && bookmarks.length === 0) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bookmarks.length > 0) {
    const filterSummary = [
      selectedCategory && `카테고리: ${selectedCategory}`,
      selectedTags.length > 0 && `태그: ${selectedTags.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <>
        <div className="mb-4 text-sm text-muted-foreground">
          총 {total}개의 북마크
          {filterSummary && ` (${filterSummary})`}
        </div>
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'
              : 'flex flex-col gap-3'
          )}
        >
          {bookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              ref={index === bookmarks.length - 1 ? lastElementRef : null}
            >
              <BookmarkCard
                bookmark={bookmark}
                allTags={allTags}
                viewMode={viewMode}
                selectedTags={selectedTags}
                onDelete={onDelete}
                onUpdateFields={onUpdateFields}
                onTagClick={onTagClick}
              />
            </div>
          ))}
        </div>

        {/* 로딩 인디케이터 */}
        {loading && bookmarks.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 더 이상 데이터가 없을 때 */}
        {!hasMore && bookmarks.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            모든 북마크를 불러왔습니다.
          </div>
        )}
      </>
    );
  }

  return (
    <div className="py-20 text-center">
      <Bookmark className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
      <p className="mb-2 text-lg text-muted-foreground">북마크가 없습니다</p>
      <p className="text-sm text-muted-foreground">
        위의 폼을 사용하여 북마크를 추가해보세요.
      </p>
    </div>
  );
});
