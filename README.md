# 컨퍼런스 비디오 (Conference View)

개발 컨퍼런스 발표 영상을 한 곳에서 모아보고, 필터링하여 검색할 수 있는 웹 애플리케이션입니다.
<img width="2400" height="2904" alt="main-page" src="https://github.com/user-attachments/assets/2feb00d4-40f8-42d4-b5ea-03a9b3cdc0c1" />



## 📋 목차

- [소개](#소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [주요 페이지 및 기능](#주요-페이지-및-기능)
- [환경 변수 설정](#환경-변수-설정)
- [개발 가이드](#개발-가이드)
- [배포](#배포)

## 소개

이 프로젝트는 FEConf, NDC, if(kakao), 당근테크, 채널톡 등 다양한 개발 컨퍼런스의 발표 영상을 수집하고, 연도, 컨퍼런스, 개발언어, 직군별로 필터링하여 볼 수 있도록 제공합니다.

### 주요 특징

- 🎥 **다양한 컨퍼런스 영상 수집**: FEConf, NDC, 당근테크, 채널톡 등 주요 개발 컨퍼런스 영상 제공
- 🔍 **강력한 필터링 시스템**: 연도, 컨퍼런스, 개발언어, 직군별 다중 필터 지원
- ⭐ **즐겨찾기 기능**: 관심 있는 영상을 즐겨찾기에 추가하여 빠르게 접근
- 📝 **메모 작성**: 영상을 보며 실시간으로 메모 작성 가능
- 🔖 **북마크 기능**: 유용한 웹사이트나 리소스를 북마크로 저장하고 태그로 관리
- 🌓 **다크 모드**: 라이트/다크 테마 지원
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 경험

## 주요 기능

### 1. 비디오 목록 및 필터링

메인 페이지에서 다양한 컨퍼런스 영상을 확인하고 필터링할 수 있습니다.

- **연도 필터**: 2017년부터 현재까지의 연도별 필터링
- **컨퍼런스 필터**: FEConf, NDC, 당근테크, 채널톡 등 컨퍼런스별 필터링
- **개발언어 필터**: JavaScript, TypeScript, Python, Go 등 개발언어별 필터링 (대소문자 무시)
- **직군 필터**: Frontend, Backend, DevOps, AI/ML 등 직군별 필터링
- **정렬 옵션**: 최신순, 오래된순, 제목순 정렬
- **무한 스크롤**: 스크롤을 내리면 자동으로 다음 페이지의 영상이 로드됩니다


### 2. 비디오 재생

비디오 카드를 클릭하면 전체 화면으로 영상이 재생됩니다.

- **전체 화면 재생**: 클릭한 영상이 전체 화면으로 재생됩니다
- **메모 작성**: 영상 재생 중 오른쪽 패널에서 메모를 작성할 수 있습니다
- **YouTube 링크**: 원본 YouTube 영상으로 이동할 수 있는 버튼 제공

<img width="2400" height="2904" alt="video-player-fullscreen" src="https://github.com/user-attachments/assets/dea8c9da-df09-417e-a199-edbb90c45523" />


### 3. 즐겨찾기

로그인한 사용자는 관심 있는 영상을 즐겨찾기에 추가할 수 있습니다.

- **즐겨찾기 추가/제거**: 각 비디오 카드의 별 아이콘을 클릭하여 즐겨찾기에 추가/제거
- **즐겨찾기 목록**: 상단 네비게이션의 "즐겨찾기" 버튼을 클릭하여 즐겨찾기한 영상만 모아서 볼 수 있습니다

### 4. 북마크

유용한 웹사이트나 리소스를 북마크로 저장하고 태그로 관리할 수 있습니다.

- **북마크 추가**: URL을 입력하여 북마크를 추가합니다. 자동으로 썸네일과 메타데이터를 가져옵니다
- **태그 관리**: 북마크에 태그를 추가하여 분류할 수 있습니다. 기존 태그 자동완성 기능 제공
- **태그 필터링**: 사이드바에서 태그를 선택하여 해당 태그가 있는 북마크만 필터링할 수 있습니다 (OR 조건)
- **무한 스크롤**: 북마크 목록도 무한 스크롤을 지원합니다
- **중복 방지**: 동일한 URL은 중복 추가할 수 없습니다

<img width="2400" height="2904" alt="bookmarks-page" src="https://github.com/user-attachments/assets/825d85d6-d523-447f-952c-0da7cbe23174" />


### 5. 메모 작성

로그인한 사용자는 영상을 보며 실시간으로 메모를 작성할 수 있습니다.

- **실시간 메모**: 영상 재생 중 오른쪽 패널에서 메모를 작성할 수 있습니다
- **마크다운 지원**: 메모는 마크다운 형식을 지원합니다
- **비디오별 메모**: 각 영상마다 별도의 메모를 작성할 수 있습니다

### 6. 인증

Google OAuth를 통한 간편한 로그인을 지원합니다.

- **Google 로그인**: Google 계정으로 간편하게 로그인
- **로그인 필요 기능**: 즐겨찾기, 메모 작성 기능은 로그인이 필요합니다
- **북마크**: 로그인하지 않은 사용자도 북마크 페이지에 접근할 수 있지만, 북마크 추가는 로그인이 필요합니다

## 기술 스택

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Analytics**: Google Analytics

### 주요 라이브러리

- `react-markdown`: 마크다운 렌더링
- `highlight.js`: 코드 하이라이팅
- `lucide-react`: 아이콘
- `next-themes`: 다크 모드 지원

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- pnpm (또는 npm, yarn)
- Supabase 계정 및 프로젝트

### 설치

1. 저장소 클론

```bash
git clone <repository-url>
cd conference_view
```

2. 의존성 설치

```bash
cd frontend
pnpm install
```

3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GA_ID=your_google_analytics_id (선택사항)
```

4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 프로젝트 구조

```
conference_view/
├── frontend/                 # Next.js 프론트엔드 애플리케이션
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx          # 메인 비디오 목록 페이지
│   │   ├── bookmarks/        # 북마크 페이지
│   │   ├── favorites/        # 즐겨찾기 페이지
│   │   ├── api/              # API Routes
│   │   │   └── bookmarks/
│   │   │       └── embed/    # 북마크 임베드 데이터 API
│   │   └── layout.tsx        # 루트 레이아웃
│   ├── components/            # React 컴포넌트
│   │   ├── video/            # 비디오 관련 컴포넌트
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoFilters.tsx
│   │   │   └── VideoNotePanel.tsx
│   │   ├── bookmark/         # 북마크 관련 컴포넌트
│   │   │   ├── BookmarkCard.tsx
│   │   │   ├── BookmarkForm.tsx
│   │   │   ├── BookmarkList.tsx
│   │   │   └── TagSidebar.tsx
│   │   ├── favorite/          # 즐겨찾기 관련 컴포넌트
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   └── ui/                # 공통 UI 컴포넌트
│   ├── contexts/              # React Context
│   │   ├── AuthContext.tsx
│   │   └── FavoritesContext.tsx
│   ├── hooks/                 # Custom Hooks
│   │   ├── useInfiniteVideos.ts
│   │   ├── useBookmarks.ts
│   │   └── useAnalytics.ts
│   ├── lib/                   # 유틸리티 및 라이브러리
│   │   ├── supabase/         # Supabase 관련
│   │   │   ├── client.ts
│   │   │   ├── queries/      # 데이터베이스 쿼리
│   │   │   │   ├── videos.ts
│   │   │   │   ├── bookmarks.ts
│   │   │   │   ├── favorites.ts
│   │   │   │   └── notes.ts
│   │   │   └── types/        # TypeScript 타입 정의
│   │   ├── cache/             # 클라이언트 캐싱
│   │   ├── analytics/         # Google Analytics
│   │   ├── config/            # 설정
│   │   └── utils/             # 유틸리티 함수
│   └── public/                # 정적 파일
├── docs/                      # 문서
│   └── screenshots/           # 스크린샷 이미지
└── README.md                  # 프로젝트 README
```

## 주요 페이지 및 기능

### 메인 페이지 (`/`)

비디오 목록을 표시하고 필터링할 수 있는 메인 페이지입니다.

**주요 기능:**
- 비디오 카드 그리드 레이아웃
- 좌측 사이드바 필터
- 무한 스크롤
- 비디오 클릭 시 전체 화면 재생

### 북마크 페이지 (`/bookmarks`)

웹사이트나 리소스를 북마크로 저장하고 관리하는 페이지입니다.

**주요 기능:**
- 북마크 추가 폼 (URL 입력, 태그 자동완성)
- 북마크 카드 목록 (임베드 또는 썸네일 표시)
- 태그 사이드바 (태그별 필터링)
- 북마크 수정/삭제
- 무한 스크롤

### 즐겨찾기 페이지 (`/favorites`)

즐겨찾기한 영상만 모아서 볼 수 있는 페이지입니다.

**주요 기능:**
- 즐겨찾기한 영상 목록
- 즐겨찾기 제거

## 환경 변수 설정

프로젝트 루트의 `frontend/.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (선택사항)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_google_analytics_measurement_id
```

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. Authentication > Providers에서 Google OAuth 설정
3. Database에서 필요한 테이블 생성 (아래 참고)

### 데이터베이스 스키마

주요 테이블:

- `videos`: 비디오 정보
- `filter_options`: 필터 옵션 (연도, 컨퍼런스, 개발언어, 직군)
- `favorites`: 사용자별 즐겨찾기
- `bookmarks`: 북마크 정보
- `notes`: 비디오별 메모

## 개발 가이드

### 코드 스타일

- TypeScript 사용
- ESLint 설정 준수
- 함수형 컴포넌트 및 Hooks 사용
- Custom Hooks로 로직 분리

### 주요 패턴

1. **컴포넌트 구조**: 기능별로 디렉토리 분리 (`video/`, `bookmark/`, `favorite/`)
2. **데이터 페칭**: `lib/supabase/queries/`에서 쿼리 함수 분리
3. **캐싱**: 클라이언트 측 캐싱 및 서버 측 캐싱 활용
4. **에러 처리**: 중앙화된 에러 처리 유틸리티 사용

### 빌드

```bash
cd frontend
pnpm build
```

### 린팅

```bash
cd frontend
pnpm lint
```

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정
4. 배포 완료

### 이미지 최적화

Vercel의 이미지 최적화 비용을 절감하기 위해 다음 설정이 적용되어 있습니다:

- 최대 캐시 기간: 1년 (31536000초)
- 이미지 형식: WebP만 사용
- 이미지 크기 최적화: deviceSizes 및 imageSizes 제한

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 기여

이슈나 풀 리퀘스트를 환영합니다!

---

**Made with ❤️ for developers**

