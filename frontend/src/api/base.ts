/**
 * 백엔드 API 베이스 URL.
 * - 로컬 개발: http://localhost:8000 (uvicorn)
 * - 배포(Vercel): 같은 도메인의 /api 서버리스 함수 → 빈 문자열
 * - VITE_API_BASE 환경변수로 언제든 덮어쓰기 가능
 */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "http://localhost:8000" : "");
