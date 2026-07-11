import type { IndustryProfileRow } from "../types";

/** Ported from backend/app/data/industry_profile.csv (team's own dataset, not part of the live KISED API). */
export const INDUSTRY_PROFILE: IndustryProfileRow[] = [
  { industry: "농업 임업 및 어업", gradRate: 37.6, femaleRate: 36.4, employedRate: 85.7, prepMonths: 10.1 },
  { industry: "광업", gradRate: 54.0, femaleRate: 7.5, employedRate: 72.7, prepMonths: 9.4 },
  { industry: "제조업", gradRate: 47.4, femaleRate: 25.8, employedRate: 85.7, prepMonths: 10.8 },
  { industry: "전기 가스 증기 및 공기조절 공급업", gradRate: 44.4, femaleRate: 40.1, employedRate: 68.3, prepMonths: 17.8 },
  { industry: "수도 하수 및 폐기물 처리 원료 재생업", gradRate: 59.9, femaleRate: 14.5, employedRate: 80.5, prepMonths: 14.0 },
  { industry: "건설업", gradRate: 56.6, femaleRate: 20.3, employedRate: 88.8, prepMonths: 8.9 },
  { industry: "도매 및 소매업", gradRate: 52.0, femaleRate: 35.1, employedRate: 86.0, prepMonths: 10.2 },
  { industry: "운수 및 창고업", gradRate: 56.1, femaleRate: 24.4, employedRate: 79.8, prepMonths: 9.7 },
  { industry: "숙박 및 음식점업", gradRate: 36.1, femaleRate: 60.6, employedRate: 81.4, prepMonths: 11.4 },
  { industry: "정보통신업", gradRate: 71.6, femaleRate: 31.6, employedRate: 85.9, prepMonths: 10.4 },
  { industry: "금융 및 보험업", gradRate: 51.6, femaleRate: 30.5, employedRate: 83.4, prepMonths: 11.1 },
  { industry: "부동산업", gradRate: 54.6, femaleRate: 55.9, employedRate: 66.4, prepMonths: 14.0 },
  { industry: "전문 과학 및 기술 서비스업", gradRate: 78.6, femaleRate: 30.3, employedRate: 89.0, prepMonths: 8.7 },
  { industry: "사업시설 관리 사업 지원 및 임대 서비스업", gradRate: 58.8, femaleRate: 36.3, employedRate: 80.0, prepMonths: 9.1 },
  { industry: "교육 서비스업", gradRate: 74.2, femaleRate: 60.8, employedRate: 81.4, prepMonths: 9.6 },
  { industry: "보건업 및 사회복지 서비스업", gradRate: 63.8, femaleRate: 54.7, employedRate: 87.0, prepMonths: 11.1 },
  { industry: "예술 스포츠 및 여가관련 서비스업", gradRate: 50.7, femaleRate: 48.2, employedRate: 71.7, prepMonths: 12.0 },
  { industry: "수리 및 기타 개인 서비스업", gradRate: 51.4, femaleRate: 48.5, employedRate: 78.8, prepMonths: 10.7 },
];

const BY_INDUSTRY = new Map(INDUSTRY_PROFILE.map((row) => [row.industry, row]));

export function industryRow(industry: string): IndustryProfileRow {
  const row = BY_INDUSTRY.get(industry);
  if (!row) throw new Error(`unknown industry: ${industry}`);
  return row;
}

export function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
