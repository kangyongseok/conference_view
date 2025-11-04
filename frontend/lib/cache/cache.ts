'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live (밀리초)
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();

  // 캐시 키 생성 (쿼리 파라미터 기반)
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  // 캐시 조회
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // 캐시 저장
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 기본 TTL: 5분
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // 캐시 삭제
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 특정 prefix로 시작하는 모든 캐시 삭제
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // 전체 캐시 삭제
  clear(): void {
    this.cache.clear();
  }

  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const cache = new Cache();

// 주기적으로 만료된 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}
