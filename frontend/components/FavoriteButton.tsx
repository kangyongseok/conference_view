'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';

interface FavoriteButtonProps {
  youtubeId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

const FavoriteButton = ({
  youtubeId,
  className,
  size = 'md',
  variant = 'ghost',
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);
  const { logFavoriteAdd, logFavoriteRemove } = useAnalytics();

  const favorite = isFavorite(youtubeId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    setIsToggling(true);
    try {
      const wasFavorite = isFavorite(youtubeId);
      await toggleFavorite(youtubeId);

      if (wasFavorite) {
        logFavoriteRemove(youtubeId);
      } else {
        logFavoriteAdd(youtubeId);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleClick}
      disabled={isToggling || isLoading}
      className={cn(
        sizeClasses[size],
        className,
        favorite && variant === 'ghost' && 'text-red-500 hover:text-red-600'
      )}
      aria-label={favorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
      title={favorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
    >
      <Heart
        className={cn(iconSizes[size], favorite ? 'fill-current' : 'fill-none')}
        aria-hidden="true"
      />
    </Button>
  );
};

export default FavoriteButton;
