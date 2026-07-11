// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — `npm run build:stats`로 재생성됩니다.

export type EducationCategory = "업력" | "업종" | "기업형태" | "창업자 성별" | "창업자 연령";

export interface EducationRow {
  category: EducationCategory;
  label: string;
  belowMiddle: number;
  highSchool: number;
  college2yr: number;
  college4yr: number;
  master: number;
  doctor: number;
}

/** 대졸 이상 = 대졸 + 석사 + 박사 (전문대졸은 제외) */
export function gradOrAboveRate(row: EducationRow): number {
  return row.college4yr + row.master + row.doctor;
}

export const EDUCATION: EducationRow[] = [
  { category: "업력", label: "1년", belowMiddle: 4.5, highSchool: 28.5, college2yr: 10.1, college4yr: 53.1, master: 1.4, doctor: 2.4 },
  { category: "업력", label: "2년", belowMiddle: 3.3, highSchool: 27.3, college2yr: 15.8, college4yr: 47.6, master: 4.6, doctor: 1.4 },
  { category: "업력", label: "3년", belowMiddle: 1.2, highSchool: 29.9, college2yr: 17, college4yr: 48.9, master: 2, doctor: 1 },
  { category: "업력", label: "4년", belowMiddle: 2.6, highSchool: 25.6, college2yr: 13.8, college4yr: 51.9, master: 5, doctor: 1.1 },
  { category: "업력", label: "5년", belowMiddle: 1, highSchool: 27.1, college2yr: 16.7, college4yr: 49.5, master: 4.9, doctor: 0.9 },
  { category: "업력", label: "6년", belowMiddle: 4, highSchool: 34.2, college2yr: 12.2, college4yr: 43, master: 5.5, doctor: 1.2 },
  { category: "업력", label: "7년", belowMiddle: 3.5, highSchool: 21.6, college2yr: 23.2, college4yr: 46.3, master: 4.5, doctor: 0.8 },
  { category: "업종", label: "농업 임업 및 어업", belowMiddle: 5.6, highSchool: 52.3, college2yr: 4.6, college4yr: 32.4, master: 5.1, doctor: 0.1 },
  { category: "업종", label: "광업", belowMiddle: 1, highSchool: 37.3, college2yr: 7.6, college4yr: 54, master: 0, doctor: 0 },
  { category: "업종", label: "제조업", belowMiddle: 4.7, highSchool: 30.3, college2yr: 17.6, college4yr: 43.3, master: 3.4, doctor: 0.7 },
  { category: "업종", label: "전기 가스 증기 및 공기조절 공급업", belowMiddle: 0.3, highSchool: 30.5, college2yr: 24.7, college4yr: 37.6, master: 2.9, doctor: 3.9 },
  { category: "업종", label: "수도 하수 및 폐기물 처리 원료 재생업", belowMiddle: 0.3, highSchool: 23.2, college2yr: 16.5, college4yr: 57.1, master: 0.8, doctor: 2 },
  { category: "업종", label: "건설업", belowMiddle: 0.5, highSchool: 22.7, college2yr: 20.2, college4yr: 55.3, master: 1.3, doctor: 0 },
  { category: "업종", label: "도매 및 소매업", belowMiddle: 2.3, highSchool: 29.5, college2yr: 16.2, college4yr: 47.7, master: 3.8, doctor: 0.5 },
  { category: "업종", label: "운수 및 창고업", belowMiddle: 3.2, highSchool: 27.5, college2yr: 13.3, college4yr: 49.7, master: 3.2, doctor: 3.2 },
  { category: "업종", label: "숙박 및 음식점업", belowMiddle: 8.4, highSchool: 44.5, college2yr: 11.1, college4yr: 29.6, master: 3.5, doctor: 3 },
  { category: "업종", label: "정보통신업", belowMiddle: 0.5, highSchool: 16.3, college2yr: 11.7, college4yr: 66.6, master: 3.3, doctor: 1.7 },
  { category: "업종", label: "금융 및 보험업", belowMiddle: 1.9, highSchool: 25.9, college2yr: 20.6, college4yr: 48.8, master: 1, doctor: 1.8 },
  { category: "업종", label: "부동산업", belowMiddle: 0.2, highSchool: 33.2, college2yr: 11.9, college4yr: 51, master: 3.4, doctor: 0.2 },
  { category: "업종", label: "전문 과학 및 기술 서비스업", belowMiddle: 1.1, highSchool: 11.1, college2yr: 9.1, college4yr: 71.4, master: 2.3, doctor: 4.9 },
  { category: "업종", label: "사업시설 관리 사업 지원 및 임대 서비스업", belowMiddle: 3.7, highSchool: 24.8, college2yr: 12.7, college4yr: 51.7, master: 7.1, doctor: 0 },
  { category: "업종", label: "교육 서비스업", belowMiddle: 0.9, highSchool: 17.6, college2yr: 7.2, college4yr: 59.4, master: 14, doctor: 0.8 },
  { category: "업종", label: "보건업 및 사회복지 서비스업", belowMiddle: 0.1, highSchool: 25, college2yr: 11, college4yr: 43.2, master: 18.1, doctor: 2.5 },
  { category: "업종", label: "예술 스포츠 및 여가관련 서비스업", belowMiddle: 0.7, highSchool: 19.2, college2yr: 29.5, college4yr: 48.4, master: 2.3, doctor: 0 },
  { category: "업종", label: "수리 및 기타 개인 서비스업", belowMiddle: 1.1, highSchool: 29.7, college2yr: 17.8, college4yr: 43.5, master: 7.9, doctor: 0 },
  { category: "기업형태", label: "개인", belowMiddle: 2.7, highSchool: 29.9, college2yr: 16.1, college4yr: 46, master: 4.2, doctor: 1.1 },
  { category: "기업형태", label: "법인", belowMiddle: 3.2, highSchool: 22.9, college2yr: 14.2, college4yr: 54.3, master: 3.8, doctor: 1.6 },
  { category: "창업자 성별", label: "남성", belowMiddle: 2.2, highSchool: 27.8, college2yr: 15.4, college4yr: 49.6, master: 3.5, doctor: 1.5 },
  { category: "창업자 성별", label: "여성", belowMiddle: 4.1, highSchool: 27.3, college2yr: 15.7, college4yr: 46.9, master: 5.3, doctor: 0.7 },
  { category: "창업자 연령", label: "20대 이하", belowMiddle: 0.3, highSchool: 27.5, college2yr: 13.1, college4yr: 57, master: 1.6, doctor: 0.5 },
  { category: "창업자 연령", label: "30대", belowMiddle: 1.9, highSchool: 29.3, college2yr: 10.1, college4yr: 52.6, master: 5.4, doctor: 0.6 },
  { category: "창업자 연령", label: "40대", belowMiddle: 2.2, highSchool: 25.2, college2yr: 17.2, college4yr: 51.1, master: 3.6, doctor: 0.8 },
  { category: "창업자 연령", label: "50대", belowMiddle: 3.8, highSchool: 20.5, college2yr: 18.5, college4yr: 50.5, master: 4.3, doctor: 2.4 },
  { category: "창업자 연령", label: "60대 이상", belowMiddle: 3.3, highSchool: 41.6, college2yr: 12.8, college4yr: 37.9, master: 3.6, doctor: 0.7 },
];
