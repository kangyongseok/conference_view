'use client';

import { memo } from 'react';
import { Loader2, Bookmark } from 'lucide-react';
import { BookmarkCard } from '@/components/BookmarkCard';
import type { Bookmark as BookmarkType } from '@/lib/supabase/queries';

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  allTags: string[];
  loading: boolean;
  hasMore: boolean;
  total: number;
  selectedTags: string[];
  onDelete: (id: number) => void;
  onUpdateTags: (id: number, tags: string[]) => void;
  lastElementRef?: (node: HTMLElement | null) => void;
}

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  allTags,
  loading,
  hasMore,
  total,
  selectedTags,
  onDelete,
  onUpdateTags,
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
    return (
      <>
        <div className="mb-4 text-sm text-muted-foreground">
          총 {total}개의 북마크
          {selectedTags.length > 0 && ` (${selectedTags.join(', ')} 필터링)`}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {bookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              ref={index === bookmarks.length - 1 ? lastElementRef : null}
            >
              <BookmarkCard
                bookmark={bookmark}
                allTags={allTags}
                onDelete={onDelete}
                onUpdateTags={onUpdateTags}
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
