// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — `npm run build:stats`로 재생성됩니다.

export type PrepTimeCategory = "업력" | "업종" | "기업형태" | "창업자 성별" | "창업자 연령";

export interface PrepTimeRow {
  category: PrepTimeCategory;
  label: string;
  /** 창업까지 소요기간 (개월) */
  months: number;
}

export const PREP_TIME: PrepTimeRow[] = [
  { category: "업력", label: "1년", months: 9.6 },
  { category: "업력", label: "2년", months: 10.7 },
  { category: "업력", label: "3년", months: 10 },
  { category: "업력", label: "4년", months: 11.3 },
  { category: "업력", label: "5년", months: 11.3 },
  { category: "업력", label: "6년", months: 11.1 },
  { category: "업력", label: "7년", months: 11.1 },
  { category: "업종", label: "농업 임업 및 어업", months: 10.1 },
  { category: "업종", label: "광업", months: 9.4 },
  { category: "업종", label: "제조업", months: 10.8 },
  { category: "업종", label: "전기 가스 증기 및 공기조절 공급업", months: 17.8 },
  { category: "업종", label: "수도 하수 및 폐기물 처리 원료 재생업", months: 14 },
  { category: "업종", label: "건설업", months: 8.9 },
  { category: "업종", label: "도매 및 소매업", months: 10.2 },
  { category: "업종", label: "운수 및 창고업", months: 9.7 },
  { category: "업종", label: "숙박 및 음식점업", months: 11.4 },
  { category: "업종", label: "정보통신업", months: 10.4 },
  { category: "업종", label: "금융 및 보험업", months: 11.1 },
  { category: "업종", label: "부동산업", months: 14 },
  { category: "업종", label: "전문 과학 및 기술 서비스업", months: 8.7 },
  { category: "업종", label: "사업시설 관리 사업 지원 및 임대 서비스업", months: 9.1 },
  { category: "업종", label: "교육 서비스업", months: 9.6 },
  { category: "업종", label: "보건업 및 사회복지 서비스업", months: 11.1 },
  { category: "업종", label: "예술 스포츠 및 여가관련 서비스업", months: 12 },
  { category: "업종", label: "수리 및 기타 개인 서비스업", months: 10.7 },
  { category: "기업형태", label: "개인", months: 10.9 },
  { category: "기업형태", label: "법인", months: 10.5 },
  { category: "창업자 성별", label: "남성", months: 11.2 },
  { category: "창업자 성별", label: "여성", months: 9.9 },
  { category: "창업자 연령", label: "20대 이하", months: 9.5 },
  { category: "창업자 연령", label: "30대", months: 10.5 },
  { category: "창업자 연령", label: "40대", months: 11.2 },
  { category: "창업자 연령", label: "50대", months: 10.4 },
  { category: "창업자 연령", label: "60대 이상", months: 11.1 },
];
