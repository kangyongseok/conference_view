'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { pageview, event } from '@/lib/analytics/gtag';

export const useAnalytics = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // 페이지뷰 자동 추적
  useEffect(() => {
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname]);

  // 비디오 재생 시작
  const logVideoPlayStart = useCallback(
    (youtubeId: string, title: string) => {
      event({
        action: 'video_play_start',
        category: 'Video',
        label: title,
        youtube_id: youtubeId,
        video_title: title,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 비디오 재생 종료
  const logVideoPlayEnd = useCallback(
    (youtubeId: string, duration?: number) => {
      event({
        action: 'video_play_end',
        category: 'Video',
        label: youtubeId,
        value: duration,
        youtube_id: youtubeId,
        duration: duration,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 유튜브 링크 클릭
  const logVideoOpenYouTube = useCallback(
    (youtubeId: string) => {
      event({
        action: 'video_open_youtube',
        category: 'Video',
        label: youtubeId,
        youtube_id: youtubeId,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 필터 적용
  const logFilterApply = useCallback(
    (filters: {
      year?: string[];
      conference?: string[];
      programmingLanguage?: string[];
      jobType?: string[];
      sortBy?: string;
    }) => {
      event({
        action: 'filter_apply',
        category: 'Filter',
        label: `year:${filters.year?.join(',') || 'none'}, conference:${
          filters.conference?.join(',') || 'none'
        }, language:${
          filters.programmingLanguage?.join(',') || 'none'
        }, jobType:${filters.jobType?.join(',') || 'none'}, sort:${
          filters.sortBy || 'none'
        }`,
        year: filters.year?.join(',') || '',
        conference: filters.conference?.join(',') || '',
        programming_language: filters.programmingLanguage?.join(',') || '',
        job_type: filters.jobType?.join(',') || '',
        sort_by: filters.sortBy || '',
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 즐겨찾기 추가
  const logFavoriteAdd = useCallback(
    (youtubeId: string) => {
      event({
        action: 'favorite_add',
        category: 'Favorite',
        label: youtubeId,
        youtube_id: youtubeId,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 즐겨찾기 제거
  const logFavoriteRemove = useCallback(
    (youtubeId: string) => {
      event({
        action: 'favorite_remove',
        category: 'Favorite',
        label: youtubeId,
        youtube_id: youtubeId,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 로그인
  const logLogin = useCallback(
    (method: string = 'google') => {
      event({
        action: 'login',
        category: 'Auth',
        label: method,
        login_method: method,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 로그아웃
  const logLogout = useCallback(() => {
    event({
      action: 'logout',
      category: 'Auth',
      user_id: user?.id || 'anonymous',
    });
  }, [user?.id]);

  // 풀스크린 진입
  const logFullscreenEnter = useCallback(
    (youtubeId: string) => {
      event({
        action: 'fullscreen_enter',
        category: 'Video',
        label: youtubeId,
        youtube_id: youtubeId,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 풀스크린 종료
  const logFullscreenExit = useCallback(
    (youtubeId: string) => {
      event({
        action: 'fullscreen_exit',
        category: 'Video',
        label: youtubeId,
        youtube_id: youtubeId,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  // 사용자 정의 이벤트
  const logEvent = useCallback(
    (
      action: string,
      category: string,
      label?: string,
      value?: number,
      customParams?: Record<string, any>
    ) => {
      event({
        action,
        category,
        label,
        value,
        ...customParams,
        user_id: user?.id || 'anonymous',
      });
    },
    [user?.id]
  );

  return {
    logVideoPlayStart,
    logVideoPlayEnd,
    logVideoOpenYouTube,
    logFilterApply,
    logFavoriteAdd,
    logFavoriteRemove,
    logLogin,
    logLogout,
    logFullscreenEnter,
    logFullscreenExit,
    logEvent,
  };
};
