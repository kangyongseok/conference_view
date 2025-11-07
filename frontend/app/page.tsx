'use client';

import { useState, useEffect, useMemo } from 'react';
import { VideoCard, VideoFilters, VideoPlayer } from '@/components/video';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  Bookmark,
} from 'lucide-react';
import { cn, getConferenceColor } from '@/lib/utils';
import { AuthButton } from '@/components/AuthButton';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';
import { fetchFilterOptions } from '@/lib/supabase';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { VideoNotePanel } from '@/components/video';

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

  const [videoPlayerState, setVideoPlayerState] = useState<{
    videoId: string;
    isFullscreen: boolean;
  } | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteVideoId, setNoteVideoId] = useState<string>('');
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
    if (!videoPlayerState?.videoId) return null;
    return (
      videos.find((v) => v.youtube_id === videoPlayerState.videoId) || null
    );
  }, [videoPlayerState, videos]);

  const handleVideoSelect = (youtubeId: string) => {
    if (
      videoPlayerState?.videoId === youtubeId &&
      videoPlayerState?.isFullscreen
    ) {
      // 같은 비디오를 클릭하고 전체보기 모드일 때는 닫기
      setVideoPlayerState(null);
    } else {
      // 새로운 비디오를 선택하면 바로 전체보기 모드로
      setVideoPlayerState({ videoId: youtubeId, isFullscreen: true });
    }
  };

  const handleCloseVideo = () => {
    setVideoPlayerState(null);
  };

  const handleOpenYouTube = () => {
    if (!selectedVideoData) return;
    const youtubeUrl =
      selectedVideoData.video_url ||
      `https://www.youtube.com/watch?v=${selectedVideoData.youtube_id}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNoteClick = (youtubeId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    setNoteVideoId(youtubeId);
    setIsNoteOpen(true);
  };

  const handleCloseNote = () => {
    setIsNoteOpen(false);
    setNoteVideoId('');
  };

  const selectedVideoForNote = useMemo(() => {
    if (!noteVideoId) return null;
    return videos.find((v) => v.youtube_id === noteVideoId) || null;
  }, [noteVideoId, videos]);

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
    if (videoPlayerState?.isFullscreen && videoPlayerState?.videoId) {
      logFullscreenEnter(videoPlayerState.videoId);
    } else if (!videoPlayerState?.isFullscreen && videoPlayerState?.videoId) {
      logFullscreenExit(videoPlayerState.videoId);
    }
  }, [videoPlayerState, logFullscreenEnter, logFullscreenExit]);

  useEffect(() => {
    if (!videoPlayerState?.videoId) {
      setVideoPlayerState(null);
    }
  }, [videoPlayerState]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && videoPlayerState?.isFullscreen) {
        setVideoPlayerState(null);
      }
    };

    if (videoPlayerState?.isFullscreen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [videoPlayerState]);

  const handleToggleFullscreen = () => {
    setVideoPlayerState({
      videoId: videoPlayerState?.videoId || '',
      isFullscreen: !videoPlayerState?.isFullscreen,
    });
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* 메인 컨텐츠 영역 */}
        <div
          className={cn(
            'flex-1 overflow-y-auto transition-all duration-300',
            isNoteOpen && !videoPlayerState?.isFullscreen && 'mr-96'
          )}
        >
          <div className="container mx-auto p-4 lg:p-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold sm:text-3xl">비디오 목록</h1>
              <Navigation
                showVideoCount={
                  !!(selectedVideoData && !videoPlayerState?.isFullscreen)
                }
                videoCount={total}
              />
            </header>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <aside className="sticky top-0 z-40 lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:self-start">
                <div className="bg-background pb-4 lg:static lg:z-auto lg:bg-transparent">
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

              {/* 메인 컨텐츠 영역 - 사이드 패널이 열릴 때 너비 조정 */}
              <div className={cn('flex-1 min-w-0 transition-all duration-300')}>
                <main className="flex-1 min-w-0">
                  <div className="mb-4 flex items-center justify-between lg:hidden">
                    <div className="text-sm text-muted-foreground">
                      총 {total}개
                    </div>
                  </div>

                  {/* PC에서만 상단 비디오 플레이어 표시 */}
                  {selectedVideoData && !videoPlayerState?.isFullscreen && (
                    <div
                      id="video-player"
                      className="hidden lg:block mb-6 space-y-4 rounded-lg border bg-card p-4 shadow-sm lg:mb-8"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="mb-2 text-lg font-semibold leading-tight lg:text-xl">
                            {selectedVideoData.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {selectedVideoData.conference_name && (
                              <span
                                className="font-medium"
                                style={
                                  getConferenceColor(
                                    selectedVideoData.conference_name
                                  )
                                    ? {
                                        color: getConferenceColor(
                                          selectedVideoData.conference_name
                                        ),
                                      }
                                    : {}
                                }
                              >
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
                        <div className="flex gap-2 shrink-0 sm:ml-4">
                          {user && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleNoteClick(selectedVideoData.youtube_id)
                              }
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              메모
                            </Button>
                          )}
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
                            ref={
                              index === videos.length - 1
                                ? lastElementRef
                                : null
                            }
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
                              isSelected={
                                videoPlayerState?.videoId === video.youtube_id
                              }
                              onNoteClick={handleNoteClick}
                              className={cn('transition-all')}
                              priority={index < 4} // LCP 최적화: 첫 4개 카드에 priority 적용 (fetchpriority=high, loading=eager)
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
          </div>
        </div>

        {/* 사이드 패널 - 오른쪽에 고정, 메인 컨텐츠를 밀어냄 (일반 모드) */}
        {selectedVideoForNote && !videoPlayerState?.isFullscreen && (
          <div
            className={cn(
              'fixed right-0 top-0 h-full w-96 border-l bg-background shadow-xl transition-transform duration-300 ease-in-out z-40',
              isNoteOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <VideoNotePanel
              youtubeId={noteVideoId}
              title={selectedVideoForNote.title}
              isOpen={isNoteOpen}
              onClose={handleCloseNote}
            />
          </div>
        )}

        {/* 전체보기 모드 */}
        {selectedVideoData && videoPlayerState?.isFullscreen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-lg font-semibold sm:text-xl">
                  {selectedVideoData.title}
                </h2>
                {selectedVideoData.conference_name && (
                  <p
                    className="mt-1 text-sm"
                    style={
                      getConferenceColor(selectedVideoData.conference_name)
                        ? {
                            color: getConferenceColor(
                              selectedVideoData.conference_name
                            ),
                          }
                        : {}
                    }
                  >
                    {selectedVideoData.conference_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {user && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleNoteClick(selectedVideoData.youtube_id)
                    }
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    메모
                  </Button>
                )}
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

        {/* 사이드 패널 - 전체보기 모드에서 오른쪽에 표시 */}
        {selectedVideoForNote && videoPlayerState?.isFullscreen && (
          <div
            className={cn(
              'fixed right-0 top-0 h-full w-96 border-l bg-background shadow-xl transition-transform duration-300 ease-in-out z-60',
              isNoteOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <VideoNotePanel
              youtubeId={noteVideoId}
              title={selectedVideoForNote.title}
              isOpen={isNoteOpen}
              onClose={handleCloseNote}
            />
          </div>
        )}
      </div>
    </>
  );
}
