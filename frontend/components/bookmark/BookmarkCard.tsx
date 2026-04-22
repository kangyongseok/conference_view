'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  Save,
  Link as LinkIcon,
  Folder,
} from 'lucide-react';
import type { Bookmark } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BOOKMARK_CATEGORIES } from '@/lib/constants';
import type { BookmarkViewMode } from '@/hooks/useBookmarkViewMode';

interface BookmarkCardProps {
  bookmark: Bookmark;
  allTags: string[];
  viewMode: BookmarkViewMode;
  selectedTags: string[];
  onDelete: (id: number) => void;
  onUpdateFields: (
    id: number,
    updates: { tags?: string[]; category?: string | null }
  ) => void;
  onTagClick: (tag: string) => void;
}

// 내부 인터랙션 요소의 이벤트가 카드 전체 클릭으로 버블링되지 않도록 막는 헬퍼
const stop = (e: React.SyntheticEvent) => {
  e.stopPropagation();
};

export const BookmarkCard = ({
  bookmark,
  allTags,
  viewMode,
  selectedTags,
  onDelete,
  onUpdateFields,
  onTagClick,
}: BookmarkCardProps) => {
  const { logBookmarkOpen } = useAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState<string[]>(bookmark.tags);
  const [editCategory, setEditCategory] = useState<string | null>(
    bookmark.category
  );
  const [newTag, setNewTag] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    onUpdateFields(bookmark.id, {
      tags: editTags,
      category: editCategory,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTags(bookmark.tags);
    setEditCategory(bookmark.category);
    setIsEditing(false);
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !editTags.includes(tag.trim())) {
      setEditTags([...editTags, tag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleOpenBookmark = useCallback(() => {
    logBookmarkOpen(bookmark.url);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  }, [bookmark.url, logBookmarkOpen]);

  // 카드 클릭 → 링크 열기 (편집 중이 아닐 때만)
  const handleCardClick = () => {
    if (isEditing) return;
    handleOpenBookmark();
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenBookmark();
    }
  };

  // 이미지 표시 여부 결정
  const shouldShowImage = bookmark.thumbnail_url && !imageError;
  const shouldShowPlaceholder =
    !bookmark.embed_html && (!bookmark.thumbnail_url || imageError);

  const isList = viewMode === 'list';

  // 썸네일 / 임베드 영역
  const mediaBlock = bookmark.embed_html ? (
    <div
      className={cn(
        'overflow-hidden rounded-lg',
        isList ? 'w-full sm:w-64 sm:shrink-0' : 'mb-4'
      )}
      onClick={stop}
      dangerouslySetInnerHTML={{ __html: bookmark.embed_html }}
    />
  ) : shouldShowImage ? (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-lg bg-muted',
        isList ? 'w-full sm:w-64 sm:shrink-0' : 'mb-4 w-full'
      )}
    >
      <Image
        src={bookmark.thumbnail_url || ''}
        alt={bookmark.title || '북마크'}
        fill
        className="object-cover"
        sizes={
          isList
            ? '(max-width: 640px) 100vw, 256px'
            : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
        }
        quality={75}
        unoptimized={
          bookmark.thumbnail_url
            ? bookmark.thumbnail_url.startsWith('http') &&
              !bookmark.thumbnail_url.includes('img.youtube.com') &&
              !bookmark.thumbnail_url.includes('i.ytimg.com')
            : false
        }
        onError={handleImageError}
      />
    </div>
  ) : shouldShowPlaceholder ? (
    <div
      className={cn(
        'flex aspect-video items-center justify-center rounded-lg bg-muted p-4',
        isList ? 'w-full sm:w-64 sm:shrink-0' : 'mb-4 w-full'
      )}
    >
      {bookmark.title ? (
        <h3 className="line-clamp-3 text-center text-sm font-semibold text-muted-foreground">
          {bookmark.title}
        </h3>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <LinkIcon className="h-8 w-8" />
          <span className="text-xs">북마크</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <Card
      role={isEditing ? undefined : 'link'}
      aria-label={isEditing ? undefined : bookmark.title || bookmark.url}
      tabIndex={isEditing ? undefined : 0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg',
        !isEditing &&
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <CardContent
        className={cn(
          'p-4',
          isList && 'flex flex-col gap-4 sm:flex-row sm:items-start'
        )}
      >
        {mediaBlock}

        <div className={cn(isList && 'flex-1 min-w-0')}>
          {/* 제목 */}
          {(shouldShowImage || bookmark.embed_html) && bookmark.title && (
            <h3
              className={cn(
                'mb-2 font-semibold leading-tight',
                isList ? 'line-clamp-2 text-lg' : 'line-clamp-2 text-base'
              )}
            >
              {bookmark.title}
            </h3>
          )}

          {/* 설명 */}
          {bookmark.description && (
            <p
              className={cn(
                'mb-3 text-sm text-muted-foreground',
                isList ? 'line-clamp-3' : 'line-clamp-2'
              )}
            >
              {bookmark.description}
            </p>
          )}

          {/* URL */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="mb-3 block truncate text-xs text-primary hover:underline"
          >
            {bookmark.url}
          </a>

          {/* 카테고리 / 태그 */}
          <div className="mb-3">
            {isEditing ? (
              <div className="space-y-3" onClick={stop}>
                {/* 카테고리 선택 */}
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <select
                    value={editCategory ?? ''}
                    onChange={(e) =>
                      setEditCategory(e.target.value || null)
                    }
                    onClick={stop}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="">카테고리 없음</option>
                    {BOOKMARK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 현재 태그 */}
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          stop(e);
                          handleRemoveTag(tag);
                        }}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* 태그 입력 */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="태그 추가"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onClick={stop}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (isComposing) return;
                      if (e.key === 'Enter' && newTag.trim()) {
                        e.preventDefault();
                        handleAddTag(newTag);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      stop(e);
                      handleSave();
                    }}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>

                {/* 기존 태그에서 선택 */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {allTags
                      .filter((tag) => !editTags.includes(tag))
                      .map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            stop(e);
                            handleAddTag(tag);
                          }}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {bookmark.category && (
                  <Badge
                    variant="outline"
                    className="cursor-default gap-1 border-primary/40 bg-primary/5 text-primary"
                    onClick={stop}
                  >
                    <Folder className="h-3 w-3" />
                    {bookmark.category}
                  </Badge>
                )}
                {bookmark.tags.length > 0 ? (
                  bookmark.tags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        variant={isActive ? 'default' : 'secondary'}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          stop(e);
                          onTagClick(tag);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onTagClick(tag);
                          }
                        }}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground',
                          isActive && 'ring-2 ring-primary ring-offset-1'
                        )}
                      >
                        {tag}
                      </Badge>
                    );
                  })
                ) : !bookmark.category ? (
                  <span className="text-xs text-muted-foreground">
                    태그 없음
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  stop(e);
                  if (isEditing) {
                    handleCancelEdit();
                  } else {
                    setEditTags(bookmark.tags);
                    setEditCategory(bookmark.category);
                    setIsEditing(true);
                  }
                }}
                aria-label={isEditing ? '편집 취소' : '편집'}
              >
                {isEditing ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  stop(e);
                  onDelete(bookmark.id);
                }}
                className="text-destructive hover:text-destructive"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                stop(e);
                handleOpenBookmark();
              }}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              열기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
