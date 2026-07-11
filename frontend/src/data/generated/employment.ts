// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — `npm run build:stats`로 재생성됩니다.

export type EmploymentCategory = "업력" | "업종" | "기업형태" | "창업자 성별" | "창업자 연령";

export interface EmploymentRow {
  category: EmploymentCategory;
  label: string;
  employed: number;
  notEmployed: number;
}

export const EMPLOYMENT: EmploymentRow[] = [
  { category: "업력", label: "1년", employed: 78.5, notEmployed: 21.5 },
  { category: "업력", label: "2년", employed: 81.8, notEmployed: 18.2 },
  { category: "업력", label: "3년", employed: 84.9, notEmployed: 15.1 },
  { category: "업력", label: "4년", employed: 86.7, notEmployed: 13.3 },
  { category: "업력", label: "5년", employed: 79.5, notEmployed: 20.5 },
  { category: "업력", label: "6년", employed: 84.4, notEmployed: 15.6 },
  { category: "업력", label: "7년", employed: 85.1, notEmployed: 14.9 },
  { category: "업종", label: "농업 임업 및 어업", employed: 85.7, notEmployed: 14.3 },
  { category: "업종", label: "광업", employed: 72.7, notEmployed: 27.3 },
  { category: "업종", label: "제조업", employed: 85.7, notEmployed: 14.3 },
  { category: "업종", label: "전기 가스 증기 및 공기조절 공급업", employed: 68.3, notEmployed: 31.7 },
  { category: "업종", label: "수도 하수 및 폐기물 처리 원료 재생업", employed: 80.5, notEmployed: 19.5 },
  { category: "업종", label: "건설업", employed: 88.8, notEmployed: 11.2 },
  { category: "업종", label: "도매 및 소매업", employed: 86, notEmployed: 14 },
  { category: "업종", label: "운수 및 창고업", employed: 79.8, notEmployed: 20.2 },
  { category: "업종", label: "숙박 및 음식점업", employed: 81.4, notEmployed: 18.6 },
  { category: "업종", label: "정보통신업", employed: 85.9, notEmployed: 14.1 },
  { category: "업종", label: "금융 및 보험업", employed: 83.4, notEmployed: 16.6 },
  { category: "업종", label: "부동산업", employed: 66.4, notEmployed: 33.6 },
  { category: "업종", label: "전문 과학 및 기술 서비스업", employed: 89, notEmployed: 11 },
  { category: "업종", label: "사업시설 관리 사업 지원 및 임대 서비스업", employed: 80, notEmployed: 20 },
  { category: "업종", label: "교육 서비스업", employed: 81.4, notEmployed: 18.6 },
  { category: "업종", label: "보건업 및 사회복지 서비스업", employed: 87, notEmployed: 13 },
  { category: "업종", label: "예술 스포츠 및 여가관련 서비스업", employed: 71.7, notEmployed: 28.3 },
  { category: "업종", label: "수리 및 기타 개인 서비스업", employed: 78.8, notEmployed: 21.2 },
  { category: "기업형태", label: "개인", employed: 82.5, notEmployed: 17.5 },
  { category: "기업형태", label: "법인", employed: 84.5, notEmployed: 15.5 },
  { category: "창업자 성별", label: "남성", employed: 83.7, notEmployed: 16.3 },
  { category: "창업자 성별", label: "여성", employed: 82, notEmployed: 18 },
  { category: "창업자 연령", label: "20대 이하", employed: 31.6, notEmployed: 68.4 },
  { category: "창업자 연령", label: "30대", employed: 89.7, notEmployed: 10.3 },
  { category: "창업자 연령", label: "40대", employed: 82.2, notEmployed: 17.8 },
  { category: "창업자 연령", label: "50대", employed: 83.7, notEmployed: 16.3 },
  { category: "창업자 연령", label: "60대 이상", employed: 84.5, notEmployed: 15.5 },
];
