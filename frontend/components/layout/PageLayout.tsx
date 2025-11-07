'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  sidebarClassName?: string;
  mainClassName?: string;
}

export const PageLayout = ({
  children,
  sidebar,
  className,
  sidebarClassName,
  mainClassName,
}: PageLayoutProps) => {
  return (
    <div className={cn('container mx-auto p-4 lg:p-6', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {sidebar && (
          <aside
            className={cn(
              'lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start',
              sidebarClassName
            )}
          >
            {sidebar}
          </aside>
        )}
        <main className={cn('flex-1 min-w-0', mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
};

