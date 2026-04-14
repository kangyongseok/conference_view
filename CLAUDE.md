# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

국내 개발 컨퍼런스(FEConf, NDC, if(kakao), 당근테크, 채널톡 등) 발표 영상을 모아보고 필터링할 수 있는 웹 애플리케이션. Supabase를 백엔드로 사용하는 Next.js 프론트엔드 단일 구조.

배포 URL: `https://conference-view.vercel.app`

## 개발 명령어

모든 명령어는 `frontend/` 디렉토리에서 실행:

```bash
cd frontend

pnpm dev        # 개발 서버 실행 (localhost:3000)
pnpm build      # 프로덕션 빌드
pnpm start      # 프로덕션 서버 실행
pnpm lint       # ESLint 실행
```

패키지 매니저: **pnpm** (루트에는 별도 `package.json`이 있지만, 프론트엔드 작업은 `frontend/`에서만 진행)

## 환경 변수

`frontend/.env.local` 필수 설정:

```env
NEXT_PUBLIC_SUPABASE_URL=...        # 필수
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # 필수
NEXT_PUBLIC_SITE_URL=...            # OAuth 리디렉션 URL
NEXT_PUBLIC_GA_MEASUREMENT_ID=...   # GA4 (선택)
NEXT_PUBLIC_CLARITY=...             # Microsoft Clarity (선택)
```

루트의 `.env`는 YouTube API 임포트 스크립트용:

```env
YOUTUBE_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
```

## 아키텍처

### 레이어 구조

```
app/                   # Next.js App Router 페이지 (서버/클라이언트 컴포넌트 혼용)
components/            # React 컴포넌트 (video/, bookmark/, favorite/, layout/, ui/)
contexts/              # 전역 상태 (AuthContext, FavoritesContext)
hooks/                 # 커스텀 훅 (useInfiniteVideos, useBookmarks, useAnalytics)
lib/
  supabase/
    client.ts          # 브라우저용 Supabase 클라이언트 (createBrowserClient)
    server.ts          # 서버용 Supabase 클라이언트 (createServerClient + cookies)
    queries/           # 도메인별 DB 쿼리 함수 (videos, bookmarks, favorites, notes)
    types/             # TypeScript 타입 (Video, Bookmark, Favorite, Note)
  cache/cache.ts       # 클라이언트 인메모리 캐시 (TTL 기반, 싱글톤)
  config/env.ts        # 환경변수 타입 안전 래퍼 (서버사이드 유효성 검사 포함)
  constants/index.ts   # 캐시 TTL, 페이지네이션 상수
  analytics/gtag.ts    # Google Analytics 이벤트 헬퍼
  utils/errors.ts      # 에러 처리 유틸리티
```

### 경로 별칭

`@/`는 `frontend/` 루트를 가리킴 (tsconfig.json `paths` 설정).

### Supabase 클라이언트 구분

- **브라우저**: `lib/supabase/client.ts` → `createBrowserClient` (클라이언트 컴포넌트에서 사용)
- **서버**: `lib/supabase/server.ts` → `createServerClient` + Next.js `cookies()` (서버 컴포넌트/Route Handler에서 사용)

쿼리 함수들(`lib/supabase/queries/`)은 `'use client'` 지시어를 포함하며 브라우저 클라이언트를 사용함. 이 함수들은 서버 컴포넌트에서 직접 호출하지 말 것.

### 캐싱 전략

두 레이어의 캐싱이 있음:
1. **클라이언트 인메모리 캐시** (`lib/cache/cache.ts`): 쿼리 결과를 TTL 기반으로 캐시 (videos: 5분, filter_options: 30분 등)
2. **Next.js 서버 캐시** (`unstable_cache`): API Route(`/api/bookmarks/embed`)에서 24시간 캐시

### 전역 상태 (Context)

- `AuthContext`: Supabase Auth 상태 관리, Google OAuth 로그인/로그아웃
- `FavoritesContext`: 로그인한 사용자의 즐겨찾기 목록 (youtube_id 배열로 관리)
- 두 Context 모두 `layout.tsx`에서 전체 앱을 감싸고 있음

### 무한 스크롤

`useInfiniteVideos` 훅이 `IntersectionObserver`로 구현됨. 필터 변경 시 자동으로 페이지를 리셋하고 재로드함. `useBookmarks` 훅도 동일한 패턴 사용.

### DB 스키마 (Supabase)

- `videos`: youtube_id(PK), title, conference_name, channel_name, year, programming_languages(배열), job_type
- `filter_options`: type(year/conference/programming_language/job_type), value, display_order, is_active
- `favorites`: user_id, youtube_id
- `bookmarks`: user_id, url, title, description, thumbnail_url, tags(배열)
- `notes`: user_id, youtube_id, content

### 개발언어 필터 주의사항

`programming_languages` 컬럼은 대소문자가 혼재할 수 있음. 필터링 시 클라이언트에서 소문자 변환 후 비교 (`lib/supabase/queries/videos.ts`).

## 데이터 임포트 스크립트

루트에 YouTube 영상 임포트 스크립트가 있음 (Node.js, 직접 실행):

```bash
node import_youtube_videos.js    # 채널별 영상 임포트
node import_playlist_videos.js   # 재생목록별 영상 임포트
```

루트의 `.env`에 `YOUTUBE_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` 필요.

## 배포

Vercel 배포. 이미지 최적화는 WebP 형식만 사용, 캐시 TTL 1년으로 Vercel 이미지 최적화 비용 절감 설정(`next.config.ts`).
