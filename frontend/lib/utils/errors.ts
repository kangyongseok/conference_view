// 커스텀 에러 클래스
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    // TypeScript에서 Error를 확장할 때 필요
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 에러 처리 유틸리티
export const handleError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
};

// Supabase 에러를 AppError로 변환
export const handleSupabaseError = (error: any, defaultMessage: string): AppError => {
  if (error?.code === '23505') {
    // Unique constraint violation
    return new AppError('이미 존재하는 데이터입니다.', 'DUPLICATE_ENTRY', 409);
  }
  if (error?.code === 'PGRST116') {
    // No rows returned
    return new AppError('데이터를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }
  if (error?.message) {
    return new AppError(error.message, error.code || 'UNKNOWN_ERROR', 500);
  }
  return new AppError(defaultMessage, 'UNKNOWN_ERROR', 500);
};

