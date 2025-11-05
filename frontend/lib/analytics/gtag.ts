'use client';

// Google Analytics 측정 ID (환경 변수에서 가져옴)
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

const isDevelopment = process.env.NODE_ENV === 'development';

// gtag 함수 타입 정의
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// 페이지뷰 추적
export const pageview = (url: string): void => {
  if (isDevelopment) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// 이벤트 추적
export const event = ({
  action,
  category,
  label,
  value,
  ...rest
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}): void => {
  if (isDevelopment) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...rest,
    });
  }
};
