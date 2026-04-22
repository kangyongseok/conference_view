'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Folder, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BOOKMARK_CATEGORIES } from '@/lib/constants';

interface TagSidebarProps {
  tags: string[];
  selectedTags: string[];
  selectedCategory: string | null;
  onTagSelect: (tag: string) => void;
  onCategorySelect: (category: string | null) => void;
  onClearFilters: () => void;
}

export const TagSidebar = ({
  tags,
  selectedTags,
  selectedCategory,
  onTagSelect,
  onCategorySelect,
  onClearFilters,
}: TagSidebarProps) => {
  const hasActiveFilters =
    selectedTags.length > 0 || selectedCategory !== null;

  return (
    <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start">
      <div className="sticky top-0 z-40 space-y-6 bg-background pb-4 lg:static lg:z-auto">
        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              필터 초기화
            </Button>
          </div>
        )}

        {/* 카테고리 섹션 */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold lg:text-xs lg:uppercase lg:tracking-wider lg:text-muted-foreground">
            <Folder className="h-3.5 w-3.5" />
            카테고리
          </div>
          <div className="flex flex-wrap gap-2">
            {BOOKMARK_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Badge
                  key={cat}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'max-w-full cursor-pointer transition-all hover:scale-105 text-[10px]',
                    isSelected && 'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => onCategorySelect(cat)}
                >
                  <span className="truncate">{cat}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 태그 섹션 */}
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold lg:text-xs lg:uppercase lg:tracking-wider lg:text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            태그
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? 'default' : 'secondary'}
                    className={cn(
                      'max-w-full cursor-pointer transition-all hover:scale-105 text-[10px]',
                      isSelected && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => onTagSelect(tag)}
                  >
                    <Tag className="mr-1 h-3 w-3 shrink-0" />
                    <span className="truncate">{tag}</span>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">태그가 없습니다</p>
          )}
        </div>
      </div>
    </aside>
  );
};
