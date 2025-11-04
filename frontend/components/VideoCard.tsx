'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import FavoriteButton from '@/components/FavoriteButton';
import { ExternalLink, X, Maximize2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';
import { useFavorites } from '@/contexts/FavoritesContext';

interface VideoCardProps {
  youtubeId: string;
  thumbnailUrl: string;
  title: string;
  conferenceName: string | null;
  publishedAt: string | null;
  description: string | null;
  videoUrl?: string;
  className?: string;
  onVideoSelect?: (youtubeId: string) => void;
  isSelected?: boolean;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const VideoCard = ({
  youtubeId,
  thumbnailUrl,
  title,
  conferenceName,
  publishedAt,
  description,
  videoUrl,
  className,
  onVideoSelect,
  isSelected = false,
}: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { logVideoPlayStart, logVideoOpenYouTube } = useAnalytics();
  const { isFavorite } = useFavorites();
  const isFavorited = isFavorite(youtubeId);

  const handleClick = () => {
    if (onVideoSelect) {
      onVideoSelect(youtubeId);
    }
    setIsPlaying(true);
    logVideoPlayStart(youtubeId, title);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    if (onVideoSelect) {
      onVideoSelect('');
    }
  };

  const handleOpenYouTube = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = videoUrl || `https://www.youtube.com/watch?v=${youtubeId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    logVideoOpenYouTube(youtubeId);
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg',
        isSelected || isPlaying
          ? 'ring-2 ring-primary ring-offset-2'
          : 'cursor-pointer',
        isFavorited && 'ring-1 ring-yellow-500/50', // 즐겨찾기된 영상에 테두리 추가
        className
      )}
      onClick={!isPlaying ? handleClick : undefined}
    >
      {/* 썸네일 또는 비디오 플레이어 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {isPlaying ? (
          <>
            {/* 비디오 플레이어 */}
            <div className="absolute inset-0">
              <VideoPlayer
                youtubeId={youtubeId}
                autoplay={true}
                title={title}
              />
            </div>
            {/* 닫기 버튼 */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                aria-label="비디오 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* 유튜브로 보기 버튼 */}
            <div className="absolute bottom-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenYouTube}
                className="gap-2 bg-black/50 hover:bg-black/70 text-white"
                aria-label="유튜브에서 보기"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">유튜브</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <Image
              src={thumbnailUrl || '/placeholder-video.jpg'}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* 즐겨찾기 뱃지 (좌상단) */}
            {isFavorited && (
              <div className="absolute top-2 left-2 z-10">
                <div className="flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-1 shadow-md backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-white text-white" />
                  <span className="text-xs font-semibold text-white">
                    즐겨찾기
                  </span>
                </div>
              </div>
            )}
            {/* 즐겨찾기 버튼 - 즐겨찾기된 영상은 항상 표시, 아니면 hover 시 표시 */}
            <div
              className={cn(
                'absolute top-2 right-2 transition-opacity',
                isFavorited
                  ? 'opacity-100 z-10'
                  : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <FavoriteButton youtubeId={youtubeId} size="sm" />
            </div>
          </>
        )}
      </div>

      <CardContent className="p-4">
        {/* 타이틀 - 즐겨찾기된 영상은 별 아이콘 표시 */}
        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight flex items-start gap-1.5">
          {isFavorited && (
            <Star
              className="h-4 w-4 shrink-0 mt-0.5 fill-yellow-500 text-yellow-500"
              aria-label="즐겨찾기됨"
            />
          )}
          <span className="flex-1">{title}</span>
        </h3>

        {/* 컨퍼런스명 */}
        {conferenceName && (
          <p className="mb-1 text-sm font-medium text-primary">
            {conferenceName}
          </p>
        )}

        {/* 생성일자 */}
        {publishedAt && (
          <p className="mb-2 text-xs text-muted-foreground">
            {formatDate(publishedAt)}
          </p>
        )}

        {/* 디스크립션 (최대 2줄, 말줄임) */}
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoCard;
