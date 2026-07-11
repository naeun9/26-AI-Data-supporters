// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — `npm run build:stats`로 재생성됩니다.

export type GenderCategory = "업력" | "업종" | "기업형태" | "창업자 연령";

export interface GenderRow {
  category: GenderCategory;
  label: string;
  male: number;
  female: number;
}

export const GENDER: GenderRow[] = [
  { category: "업력", label: "1년", male: 69.4, female: 30.6 },
  { category: "업력", label: "2년", male: 62.2, female: 37.8 },
  { category: "업력", label: "3년", male: 69.4, female: 30.6 },
  { category: "업력", label: "4년", male: 59.4, female: 40.6 },
  { category: "업력", label: "5년", male: 73.2, female: 26.8 },
  { category: "업력", label: "6년", male: 71.5, female: 28.5 },
  { category: "업력", label: "7년", male: 64.7, female: 35.3 },
  { category: "업종", label: "농업 임업 및 어업", male: 63.6, female: 36.4 },
  { category: "업종", label: "광업", male: 92.5, female: 7.5 },
  { category: "업종", label: "제조업", male: 74.2, female: 25.8 },
  { category: "업종", label: "전기 가스 증기 및 공기조절 공급업", male: 59.9, female: 40.1 },
  { category: "업종", label: "수도 하수 및 폐기물 처리 원료 재생업", male: 85.5, female: 14.5 },
  { category: "업종", label: "건설업", male: 79.7, female: 20.3 },
  { category: "업종", label: "도매 및 소매업", male: 64.9, female: 35.1 },
  { category: "업종", label: "운수 및 창고업", male: 75.6, female: 24.4 },
  { category: "업종", label: "숙박 및 음식점업", male: 39.4, female: 60.6 },
  { category: "업종", label: "정보통신업", male: 68.4, female: 31.6 },
  { category: "업종", label: "금융 및 보험업", male: 69.5, female: 30.5 },
  { category: "업종", label: "부동산업", male: 44.1, female: 55.9 },
  { category: "업종", label: "전문 과학 및 기술 서비스업", male: 69.7, female: 30.3 },
  { category: "업종", label: "사업시설 관리 사업 지원 및 임대 서비스업", male: 63.7, female: 36.3 },
  { category: "업종", label: "교육 서비스업", male: 39.2, female: 60.8 },
  { category: "업종", label: "보건업 및 사회복지 서비스업", male: 45.3, female: 54.7 },
  { category: "업종", label: "예술 스포츠 및 여가관련 서비스업", male: 51.8, female: 48.2 },
  { category: "업종", label: "수리 및 기타 개인 서비스업", male: 51.5, female: 48.5 },
  { category: "기업형태", label: "개인", male: 64.8, female: 35.2 },
  { category: "기업형태", label: "법인", male: 70.8, female: 29.2 },
  { category: "창업자 연령", label: "20대 이하", male: 68.9, female: 31.1 },
  { category: "창업자 연령", label: "30대", male: 66.1, female: 33.9 },
  { category: "창업자 연령", label: "40대", male: 70.3, female: 29.7 },
  { category: "창업자 연령", label: "50대", male: 63.9, female: 36.1 },
  { category: "창업자 연령", label: "60대 이상", male: 66.2, female: 33.8 },
];
