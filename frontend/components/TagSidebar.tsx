'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSidebarProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onClearFilters: () => void;
}

export const TagSidebar = ({
  tags,
  selectedTags,
  onTagSelect,
  onClearFilters,
}: TagSidebarProps) => {
  return (
    <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start">
      <div className="sticky top-0 z-40 bg-background pb-4 lg:static lg:z-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold lg:text-xs lg:uppercase lg:tracking-wider lg:text-muted-foreground">
            태그
          </div>
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              초기화
            </Button>
          )}
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
                    'cursor-pointer transition-all hover:scale-105 text-[10px]',
                    isSelected && 'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => onTagSelect(tag)}
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">태그가 없습니다</p>
        )}
      </div>
    </aside>
  );
};
