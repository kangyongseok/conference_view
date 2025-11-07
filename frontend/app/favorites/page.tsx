'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';
import { VideoCard, VideoFilters } from '@/components/video';
import { PageHeader, PageLayout } from '@/components/layout';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { fetchFilterOptions } from '@/lib/supabase';
import type { FilterState } from '@/app/page';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    year: [],
    conference: [],
    programmingLanguage: [],
    jobType: [],
    sortBy: 'newest',
  });

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

  // 즐겨찾기 비디오 무한 스크롤 로드
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
      enabled: !!user, // 로그인된 경우에만 로드
      favoritesOnly: true, // 즐겨찾기만 조회
    });

  const handleVideoSelect = (youtubeId: string) => {
    if (selectedVideoId === youtubeId) {
      setSelectedVideoId('');
    } else {
      setSelectedVideoId(youtubeId);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageLayout
      sidebar={
        <div className="sticky top-0 z-40 bg-background pb-4 lg:static lg:z-auto">
          <div className="mb-4 text-sm font-semibold lg:mb-2 lg:text-xs lg:uppercase lg:tracking-wider lg:text-muted-foreground">
            필터
          </div>
          <VideoFilters
            filters={filters}
            onFilterChange={setFilters}
            availableYears={filterOptions.years}
            availableConferences={filterOptions.conferences}
            availableLanguages={filterOptions.languages}
            availableJobTypes={filterOptions.jobTypes}
          />
        </div>
      }
    >
      <PageHeader
        title="즐겨찾기"
        icon={<Star className="h-6 w-6 fill-current text-yellow-500" />}
        showBackButton
      />

      {/* 결과 개수 */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <div className="text-sm text-muted-foreground">
          총 <span className="font-semibold">{total}</span>개
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="py-8 text-center">
          <p className="mb-4 text-destructive">
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

      {/* 즐겨찾기 목록 */}
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
                  className="transition-all"
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
              모든 즐겨찾기를 불러왔습니다.
            </div>
          )}
        </>
      ) : !loading ? (
        <div className="py-20 text-center">
          <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <p className="mb-2 text-lg text-muted-foreground">
            즐겨찾기가 없습니다
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            비디오 카드의 하트 아이콘을 클릭하여 즐겨찾기에 추가하세요.
          </p>
          <Link href="/">
            <Button variant="outline">비디오 목록 보기</Button>
          </Link>
        </div>
      ) : (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </PageLayout>
  );
}
