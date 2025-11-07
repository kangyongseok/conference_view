'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import type { Bookmark } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface BookmarkCardProps {
  bookmark: Bookmark;
  allTags: string[];
  onDelete: (id: number) => void;
  onUpdateTags: (id: number, tags: string[]) => void;
}

export const BookmarkCard = ({
  bookmark,
  allTags,
  onDelete,
  onUpdateTags,
}: BookmarkCardProps) => {
  const { logBookmarkOpen } = useAnalytics();
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editTags, setEditTags] = useState<string[]>(bookmark.tags);
  const [newTag, setNewTag] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSaveTags = () => {
    onUpdateTags(bookmark.id, editTags);
    setIsEditingTags(false);
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

  const handleOpenBookmark = () => {
    logBookmarkOpen(bookmark.url);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  // 이미지 표시 여부 결정
  const shouldShowImage = bookmark.thumbnail_url && !imageError;
  const shouldShowPlaceholder =
    !bookmark.embed_html && (!bookmark.thumbnail_url || imageError);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-4">
        {/* 임베드 또는 썸네일 */}
        {bookmark.embed_html ? (
          <div
            className="mb-4 overflow-hidden rounded-lg"
            dangerouslySetInnerHTML={{ __html: bookmark.embed_html }}
          />
        ) : shouldShowImage ? (
          <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-muted relative">
            <Image
              src={bookmark.thumbnail_url || ''}
              alt={bookmark.title || '북마크'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
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
          // 썸네일이 없거나 로드 실패한 경우 회색 배경에 타이틀 표시
          <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-lg bg-muted p-4">
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
        ) : null}

        {/* 제목 (썸네일이나 임베드가 있을 때만 표시) */}
        {shouldShowImage || bookmark.embed_html
          ? bookmark.title && (
              <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight">
                {bookmark.title}
              </h3>
            )
          : null}

        {/* 설명 */}
        {bookmark.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {bookmark.description}
          </p>
        )}

        {/* URL */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block truncate text-xs text-primary hover:underline"
        >
          {bookmark.url}
        </a>

        {/* 태그 */}
        <div className="mb-3">
          {isEditingTags ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {editTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="태그 추가"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    // IME 입력 중이면 Enter 키 무시
                    if (isComposing) return;

                    if (e.key === 'Enter' && newTag.trim()) {
                      handleAddTag(newTag);
                    }
                  }}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSaveTags}>
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
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleAddTag(tag)}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.length > 0 ? (
                bookmark.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">태그 없음</span>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditingTags) {
                  setEditTags(bookmark.tags);
                  setIsEditingTags(false);
                } else {
                  setIsEditingTags(true);
                }
              }}
            >
              {isEditingTags ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(bookmark.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenBookmark}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            열기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
