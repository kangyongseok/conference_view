'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BookmarkViewMode } from '@/hooks/useBookmarkViewMode';

interface ViewModeToggleProps {
  viewMode: BookmarkViewMode;
  onChange: (mode: BookmarkViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onChange }: ViewModeToggleProps) => {
  return (
    <div
      role="group"
      aria-label="북마크 뷰 모드"
      className="inline-flex items-center rounded-md border bg-card p-0.5"
    >
      <Button
        type="button"
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label="그리드 보기"
        className={cn('h-8 px-3', viewMode !== 'grid' && 'text-muted-foreground')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">그리드</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        aria-label="리스트 보기"
        className={cn('h-8 px-3', viewMode !== 'list' && 'text-muted-foreground')}
      >
        <List className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">리스트</span>
      </Button>
    </div>
  );
};
