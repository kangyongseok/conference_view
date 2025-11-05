import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getConferenceColor = (conferenceName: string | null): string => {
  if (!conferenceName) return '';

  const name = conferenceName.toLowerCase();

  // 당근/당근마켓
  if (name.includes('당근') || name.includes('daangn')) {
    return '#f60';
  }

  // 우아한테크/우아한형제들
  if (
    name.includes('우아한') ||
    name.includes('woowahan') ||
    name.includes('woowa')
  ) {
    return 'rgb(12, 239, 211)';
  }

  // kakao/if kakao
  if (
    name.includes('kakao') ||
    name.includes('if kakao') ||
    name.includes('if(kakao)')
  ) {
    return 'rgb(250, 225, 0)';
  }

  // naver d2
  if (name.includes('d2') || name.includes('naver d2')) {
    return '#03C75A';
  }

  // 토스
  if (name.includes('toss') || name.includes('토스')) {
    return '#0064FF';
  }

  if (conferenceName.includes('FEConf')) {
    return '#3EB7F3';
  }

  return '';
};
