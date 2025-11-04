'use client';

import { useState, useEffect, useMemo } from 'react';
import VideoCard from '@/components/VideoCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import VideoFilters from '@/components/VideoFilters';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthButton } from '@/components/AuthButton';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';
import { fetchFilterOptions } from '@/lib/supabase/queries';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

export interface FilterState {
  year: string[];
  conference: string[];
  programmingLanguage: string[];
  jobType: string[];
  sortBy: string;
}

export default function Home() {
  const { logFilterApply, logFullscreenEnter, logFullscreenExit } =
    useAnalytics();
  const [filters, setFilters] = useState<FilterState>({
    year: [],
    conference: [],
    programmingLanguage: [],
    jobType: [],
    sortBy: 'newest',
  });

  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();

  // 필터 옵션
  const [filterOptions, setFilterOptions] = useState({
    years: [] as string[],
    conferences: [] as string[],
    languages: [] as string[],
    jobTypes: [] as string[],
  });

  // 필터 옵션 로드
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await fetchFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('필터 옵션 로드 실패:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // 무한 스크롤 비디오 로드
  const { videos, loading, hasMore, error, total, lastElementRef } =
    useInfiniteVideos({
      filters: {
        year: filters.year,
        conference: filters.conference,
        programmingLanguage: filters.programmingLanguage,
        jobType: filters.jobType,
        sortBy: filters.sortBy as 'newest' | 'oldest' | 'title',
      },
      pageSize: 20,
      enabled: true,
    });

  // 선택된 비디오 정보
  const selectedVideoData = useMemo(() => {
    if (!selectedVideoId) return null;
    return videos.find((v) => v.youtube_id === selectedVideoId) || null;
  }, [selectedVideoId, videos]);

  const handleVideoSelect = (youtubeId: string) => {
    if (selectedVideoId === youtubeId) {
      setSelectedVideoId('');
    } else {
      setSelectedVideoId(youtubeId);
    }
  };

  const handleCloseVideo = () => {
    setIsFullscreen(false);
    setSelectedVideoId('');
  };

  const handleOpenYouTube = () => {
    if (!selectedVideoData) return;
    const youtubeUrl =
      selectedVideoData.video_url ||
      `https://www.youtube.com/watch?v=${selectedVideoData.youtube_id}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  // 필터 적용 로그
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    logFilterApply({
      year: newFilters.year,
      conference: newFilters.conference,
      programmingLanguage: newFilters.programmingLanguage,
      jobType: newFilters.jobType,
      sortBy: newFilters.sortBy,
    });
  };

  // 풀스크린 로그
  useEffect(() => {
    if (isFullscreen && selectedVideoId) {
      logFullscreenEnter(selectedVideoId);
    } else if (!isFullscreen && selectedVideoId) {
      logFullscreenExit(selectedVideoId);
    }
  }, [isFullscreen, selectedVideoId, logFullscreenEnter, logFullscreenExit]);

  useEffect(() => {
    if (!selectedVideoId) {
      setIsFullscreen(false);
    }
  }, [selectedVideoId]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="container mx-auto p-4 lg:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">비디오 목록</h1>
          <div className="flex items-center gap-4">
            {selectedVideoData && !isFullscreen && (
              <div className="hidden text-sm text-muted-foreground lg:block">
                총 {total}개 비디오
              </div>
            )}
            {user && (
              <Link href="/favorites">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">즐겨찾기</span>
                </Button>
              </Link>
            )}
            <AuthButton />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start">
            <div className="sticky top-0 z-40 bg-background pb-4 lg:static lg:z-auto">
              <div className="mb-4 text-sm font-semibold lg:mb-2 lg:text-xs lg:uppercase lg:tracking-wider lg:text-muted-foreground">
                필터
              </div>
              <VideoFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                availableYears={filterOptions.years}
                availableConferences={filterOptions.conferences}
                availableLanguages={filterOptions.languages}
                availableJobTypes={filterOptions.jobTypes}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="text-sm text-muted-foreground">총 {total}개</div>
            </div>

            {selectedVideoData && !isFullscreen && (
              <div
                id="video-player"
                className="mb-6 space-y-4 rounded-lg border bg-card p-4 shadow-sm lg:mb-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="mb-2 text-lg font-semibold leading-tight lg:text-xl">
                      {selectedVideoData.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {selectedVideoData.conference_name && (
                        <span className="font-medium text-primary">
                          {selectedVideoData.conference_name}
                        </span>
                      )}
                      {selectedVideoData.published_at && (
                        <span className="text-muted-foreground">
                          {new Date(
                            selectedVideoData.published_at
                          ).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFullscreen}
                      className="h-9 w-9"
                      title="전체보기"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCloseVideo}
                      className="h-9 w-9"
                      title="닫기"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg">
                  <VideoPlayer
                    youtubeId={selectedVideoData.youtube_id}
                    autoplay={true}
                  />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {selectedVideoData.description && (
                    <div className="flex-1 rounded-md bg-muted/50 p-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {selectedVideoData.description}
                      </p>
                    </div>
                  )}
                  <div className="shrink-0 sm:ml-4">
                    <Button
                      variant="outline"
                      onClick={handleOpenYouTube}
                      className="w-full gap-2 sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4" />
                      유튜브로 보기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="py-8 text-center">
                <p className="text-destructive mb-4">
                  오류가 발생했습니다: {error.message}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  새로고침
                </Button>
              </div>
            )}

            {videos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {videos.map((video, index) => (
                    <div
                      key={video.youtube_id}
                      ref={index === videos.length - 1 ? lastElementRef : null}
                    >
                      <VideoCard
                        youtubeId={video.youtube_id}
                        thumbnailUrl={video.thumbnail_url || ''}
                        title={video.title}
                        conferenceName={video.conference_name}
                        publishedAt={video.published_at}
                        description={video.description}
                        videoUrl={video.video_url || undefined}
                        onVideoSelect={handleVideoSelect}
                        isSelected={selectedVideoId === video.youtube_id}
                        className={cn('transition-all')}
                      />
                    </div>
                  ))}
                </div>

                {/* 로딩 인디케이터 */}
                {loading && (
                  <div className="mt-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* 더 이상 데이터가 없을 때 */}
                {!hasMore && videos.length > 0 && (
                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    모든 비디오를 불러왔습니다.
                  </div>
                )}
              </>
            ) : !loading ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">
                  필터 조건에 맞는 비디오가 없습니다.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      year: [],
                      conference: [],
                      programmingLanguage: [],
                      jobType: [],
                      sortBy: 'newest',
                    })
                  }
                  className="mt-4"
                >
                  필터 초기화
                </Button>
              </div>
            ) : (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 전체보기 모드 */}
      {selectedVideoData && isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b bg-card px-4 py-3">
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-lg font-semibold sm:text-xl">
                {selectedVideoData.title}
              </h2>
              {selectedVideoData.conference_name && (
                <p className="mt-1 text-sm text-primary">
                  {selectedVideoData.conference_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="h-9 w-9"
                title="전체보기 해제"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseVideo}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
            <div className="w-full max-w-7xl">
              <VideoPlayer
                youtubeId={selectedVideoData.youtube_id}
                autoplay={true}
                className="w-full shadow-2xl"
              />
            </div>
          </div>

          <div className="border-t bg-card p-4">
            <div className="mx-auto max-w-7xl">
              {selectedVideoData.description && (
                <div className="mb-4 rounded-md bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedVideoData.description}
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleOpenYouTube}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  유튜브로 보기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
