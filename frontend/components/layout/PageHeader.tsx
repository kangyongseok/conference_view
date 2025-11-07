'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/AuthButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  rightActions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  icon,
  showBackButton = false,
  backHref = '/',
  rightActions,
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" aria-label="홈으로 돌아가기">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          {icon && <span className="flex items-center">{icon}</span>}
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {rightActions}
        <AuthButton />
        <ThemeToggle />
      </div>
    </header>
  );
};

