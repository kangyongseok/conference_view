import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { AppError, handleError } from '@/lib/utils/errors';

// 캐시된 fetchEmbedData 함수
const getCachedEmbedData = unstable_cache(
  async (url: string) => {
    return await fetchEmbedData(url);
  },
  ['bookmark-embed'],
  {
    revalidate: 86400, // 24시간 캐시
    tags: ['bookmark-embed'],
  }
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL이 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const embedData = await getCachedEmbedData(url);

    // 응답 헤더에 캐시 설정
    const response = NextResponse.json(embedData);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=43200'
    );

    return response;
  } catch (error) {
    console.error('Embed fetch error:', error);
    
    // 에러가 발생해도 기본값 반환 (북마크 생성은 가능하도록)
    return NextResponse.json(
      {
        title: null,
        description: null,
        thumbnail_url: null,
        html: null,
      },
      { status: 200 }
    );
  }
}

// oEmbed API로 메타데이터 가져오기
async function fetchEmbedData(url: string) {
  // YouTube, Twitter, Instagram 등 주요 사이트 지원
  let embedUrl = '';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    embedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url
    )}&format=json`;
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    embedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      url
    )}`;
  } else if (url.includes('instagram.com')) {
    embedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(
      url
    )}`;
  }

  // oEmbed를 지원하는 사이트인 경우
  if (embedUrl) {
    try {
      const response = await fetch(embedUrl);
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || null,
          description: data.description || null,
          thumbnail_url: data.thumbnail_url || data.thumbnail || null,
          html: data.html || null,
        };
      }
    } catch (error) {
      console.error('oEmbed fetch error:', error);
    }
  }

  // oEmbed를 지원하지 않는 경우 메타 태그 파싱
  try {
    const htmlResponse = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!htmlResponse.ok) {
      throw new Error('HTML을 가져올 수 없습니다.');
    }

    const html = await htmlResponse.text();
    const metaData = parseMetaTags(html, url);

    return {
      title: metaData.title,
      description: metaData.description,
      thumbnail_url: metaData.thumbnail_url,
      html: null, // 일반 웹사이트는 임베드 HTML 없음
    };
  } catch (error) {
    console.error('Meta tag parsing error:', error);
    return {
      title: null,
      description: null,
      thumbnail_url: null,
      html: null,
    };
  }
}

// HTML 엔티티 디코딩 함수
function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  return (
    text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`')
      .replace(/&#x3D;/g, '=')
      // 숫자 엔티티 디코딩 (&#123; 형식)
      .replace(/&#(\d+);/g, (match, dec) =>
        String.fromCharCode(parseInt(dec, 10))
      )
      // 16진수 엔티티 디코딩 (&#x1F; 형식)
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
  );
}

// 메타 태그 파싱 함수 (슬랙 스타일 개선)
function parseMetaTags(html: string, baseUrl: string) {
  // 제목 파싱
  const titleMatch =
    html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i
    ) ||
    html.match(
      /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:title["']/i
    );

  // 설명 파싱
  const descriptionMatch =
    html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i
    ) ||
    html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i
    ) ||
    html.match(
      /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:description["']/i
    );

  // 1. 메타 태그에서 이미지 찾기
  let thumbnailUrl = findImageFromMetaTags(html, baseUrl);

  // 2. JSON-LD 구조화된 데이터에서 이미지 찾기
  if (!thumbnailUrl) {
    thumbnailUrl = findImageFromJsonLd(html, baseUrl);
  }

  // 3. HTML 본문에서 큰 이미지 찾기 (슬랙처럼)
  if (!thumbnailUrl) {
    thumbnailUrl = findImageFromBody(html, baseUrl);
  }

  // 제목과 설명에 HTML 엔티티 디코딩 적용
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;
  const description = descriptionMatch
    ? decodeHtmlEntities(descriptionMatch[1].trim())
    : null;

  return {
    title,
    description,
    thumbnail_url: thumbnailUrl,
  };
}

// 메타 태그에서 이미지 찾기
function findImageFromMetaTags(html: string, baseUrl: string): string | null {
  const thumbnailMatches = [
    // Open Graph 이미지
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i),
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i),
    html.match(
      /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i
    ),
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image:secure_url["']/i
    ),
    // Twitter 이미지
    html.match(
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i
    ),
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i
    ),
    html.match(
      /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["']/i
    ),
    html.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image:src["']/i
    ),
    // Link 태그
    html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i),
    html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']image_src["']/i),
  ].filter(Boolean) as RegExpMatchArray[];

  if (thumbnailMatches.length > 0) {
    return normalizeImageUrl(thumbnailMatches[0][1], baseUrl);
  }

  return null;
}

// JSON-LD 구조화된 데이터에서 이미지 찾기
function findImageFromJsonLd(html: string, baseUrl: string): string | null {
  // JSON-LD 스크립트 태그 찾기
  const jsonLdMatches = html.match(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  if (!jsonLdMatches) return null;

  for (const jsonLd of jsonLdMatches) {
    try {
      const jsonContent = jsonLd.replace(/<script[^>]*>|<\/script>/gi, '');
      const data = JSON.parse(jsonContent);

      // 배열인 경우
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // 이미지 찾기
        let image = item.image || item.thumbnailUrl || item.thumbnail;

        if (image) {
          // 배열인 경우 첫 번째 이미지
          if (Array.isArray(image)) {
            image = image[0];
          }
          // 객체인 경우 URL 추출
          if (typeof image === 'object' && image.url) {
            image = image.url;
          }
          // 문자열인 경우 그대로 사용
          if (typeof image === 'string' && image) {
            return normalizeImageUrl(image, baseUrl);
          }
        }
      }
    } catch (error) {
      // JSON 파싱 실패 시 무시하고 계속
      continue;
    }
  }

  return null;
}

// HTML 본문에서 큰 이미지 찾기 (슬랙 스타일)
function findImageFromBody(html: string, baseUrl: string): string | null {
  // <body> 태그 내의 이미지만 찾기
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return null;

  const bodyHtml = bodyMatch[1];

  // 모든 img 태그 찾기
  const imgMatches = bodyHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);

  const images: Array<{ url: string; priority: number }> = [];

  for (const match of imgMatches) {
    const src = match[1];
    let priority = 0;

    // HTML 엔티티 디코딩
    const decodedSrc = src
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // 아이콘, 로고, 작은 이미지 제외
    const lowerSrc = decodedSrc.toLowerCase();
    if (
      lowerSrc.includes('icon') ||
      lowerSrc.includes('logo') ||
      lowerSrc.includes('avatar') ||
      lowerSrc.includes('favicon') ||
      lowerSrc.includes('sprite')
    ) {
      continue;
    }

    // 크기 정보 확인 (width, height 속성)
    const widthMatch = match[0].match(/width=["'](\d+)["']/i);
    const heightMatch = match[0].match(/height=["'](\d+)["']/i);
    const width = widthMatch ? parseInt(widthMatch[1]) : null;
    const height = heightMatch ? parseInt(heightMatch[1]) : null;

    // 큰 이미지에 우선순위 부여
    if (width && height) {
      const area = width * height;
      if (area > 50000) {
        // 50,000 픽셀 이상
        priority = 3;
      } else if (area > 20000) {
        // 20,000 픽셀 이상
        priority = 2;
      } else if (area > 5000) {
        priority = 1;
      }
    } else {
      // 크기 정보가 없으면 중간 우선순위
      priority = 1;
    }

    // class나 id에 hero, banner, featured 등이 있으면 우선순위 증가
    if (
      match[0].match(
        /class=["'][^"']*(hero|banner|featured|main|cover)[^"']*["']/i
      ) ||
      match[0].match(
        /id=["'][^"']*(hero|banner|featured|main|cover)[^"']*["']/i
      )
    ) {
      priority += 2;
    }

    images.push({ url: decodedSrc, priority });
  }

  // 우선순위가 높은 순으로 정렬
  images.sort((a, b) => b.priority - a.priority);

  // 가장 우선순위가 높은 이미지 반환
  if (images.length > 0 && images[0].priority > 0) {
    return normalizeImageUrl(images[0].url, baseUrl);
  }

  return null;
}

// 이미지 URL 정규화
function normalizeImageUrl(imageUrl: string, baseUrl: string): string | null {
  if (!imageUrl) return null;

  // HTML 엔티티 디코딩
  let normalized = imageUrl
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  // 상대 URL 처리
  if (!normalized.startsWith('http')) {
    try {
      const base = new URL(baseUrl);
      // 프로토콜 상대 URL (//example.com)
      if (normalized.startsWith('//')) {
        normalized = `${base.protocol}${normalized}`;
      } else if (normalized.startsWith('/')) {
        // 절대 경로
        normalized = `${base.origin}${normalized}`;
      } else {
        // 상대 경로
        normalized = new URL(normalized, base).toString();
      }
    } catch (error) {
      console.error('URL 변환 실패:', error);
      return null;
    }
  }

  return normalized;
}
