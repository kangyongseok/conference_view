'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/AuthButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Star, Bookmark, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  additionalActions?: ReactNode;
  showVideoCount?: boolean;
  videoCount?: number;
}

export const Navigation = ({
  additionalActions,
  showVideoCount = false,
  videoCount,
}: NavigationProps) => {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {showVideoCount && videoCount !== undefined && (
        <div className="hidden text-sm text-muted-foreground lg:block">
          총 {videoCount}개 비디오
        </div>
      )}
      {user && (
        <>
          <Link href="/favorites">
            <Button variant="ghost" size="sm" className="gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">즐겨찾기</span>
            </Button>
          </Link>
          <Link href="/bookmarks">
            <Button variant="ghost" size="sm" className="gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">북마크</span>
            </Button>
          </Link>
        </>
      )}
      {!user && (
        <>
          <Link href="/bookmarks">
            <Button variant="ghost" size="sm" className="gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">북마크</span>
            </Button>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <FileText className="h-4 w-4" />
            <span>로그인하면 영상 보며 메모 작성 가능</span>
          </div>
        </>
      )}
      {additionalActions}
      <AuthButton />
      <ThemeToggle />
    </div>
  );
};

