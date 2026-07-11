// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — `npm run build:stats`로 재생성됩니다.

export interface EnyBusinessGeneralRow {
  category: "업종" | "기업형태";
  label: string;
  companies: number;
  /** 업력 1~7년차 기업수 */
  years: [number, number, number, number, number, number, number];
}

export const ENY_BUSINESS_GENERAL: EnyBusinessGeneralRow[] = [
  { category: "업종", label: "농업 임업 및 어업", companies: 67066, years: [14009, 12391, 10856, 9594, 8058, 6377, 5781] },
  { category: "업종", label: "광업", companies: 841, years: [143, 153, 114, 117, 123, 100, 91] },
  { category: "업종", label: "제조업", companies: 248497, years: [39171, 36095, 38932, 38137, 34274, 32688, 29200] },
  { category: "업종", label: "전기 가스 증기 및 공기조절 공급업", companies: 148881, years: [29869, 21933, 20852, 21744, 20611, 20511, 13361] },
  { category: "업종", label: "수도 하수 및 폐기물 처리 원료 재생업", companies: 6090, years: [931, 1068, 898, 841, 886, 805, 661] },
  { category: "업종", label: "건설업", companies: 324019, years: [59185, 55881, 54197, 45852, 41261, 36345, 31298] },
  { category: "업종", label: "도매 및 소매업", companies: 1411866, years: [362875, 290021, 227681, 183150, 140957, 112204, 94978] },
  { category: "업종", label: "운수 및 창고업", companies: 325639, years: [61954, 58302, 52837, 42887, 40976, 36234, 32449] },
  { category: "업종", label: "숙박 및 음식점업", companies: 614195, years: [158851, 114157, 90127, 77182, 70035, 56438, 47405] },
  { category: "업종", label: "정보통신업", companies: 158707, years: [42335, 30989, 27574, 20033, 15683, 12310, 9783] },
  { category: "업종", label: "금융 및 보험업", companies: 35518, years: [6430, 7241, 7783, 4646, 3777, 3010, 2631] },
  { category: "업종", label: "부동산업", companies: 610954, years: [64542, 76732, 88663, 101069, 111501, 97363, 71084] },
  { category: "업종", label: "전문 과학 및 기술 서비스업", companies: 222119, years: [48421, 42677, 38451, 31066, 24592, 20154, 16758] },
  { category: "업종", label: "사업시설 관리 사업 지원 및 임대 서비스업", companies: 132544, years: [32594, 23498, 18972, 19272, 15082, 12723, 10403] },
  { category: "업종", label: "교육 서비스업", companies: 198848, years: [42994, 35409, 30252, 26442, 25553, 21616, 16582] },
  { category: "업종", label: "보건업 및 사회복지 서비스업", companies: 32521, years: [5593, 5624, 4917, 4046, 4393, 4042, 3906] },
  { category: "업종", label: "예술 스포츠 및 여가관련 서비스업", companies: 119127, years: [26039, 22618, 18016, 16108, 14982, 11371, 9993] },
  { category: "업종", label: "수리 및 기타 개인 서비스업", companies: 245057, years: [54901, 43363, 37054, 31736, 30423, 25790, 21790] },
  { category: "기업형태", label: "개인", companies: 4315648, years: [958178, 779301, 665701, 581864, 526180, 443708, 360716] },
  { category: "기업형태", label: "법인", companies: 586841, years: [92659, 98851, 102475, 92058, 76987, 66373, 57438] },
];
