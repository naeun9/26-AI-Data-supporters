import type { StartupType, TypeKey } from "../types";
import { INDUSTRY_PROFILE, industryRow, mean } from "./industryProfile";

/** Ported from the old backend/app/data.py TYPES (the live KISED backend no longer serves /api/types). */
export interface StartupTypeWithKeywords extends StartupType {
  keywords: string[];
}

export const STARTUP_TYPES: StartupTypeWithKeywords[] = [
  {
    key: "tech",
    name: "기술혁신형",
    nameEn: "TECH INNOVATOR",
    desc: "기술과 데이터로 문제를 푸는 것을 좋아하고, 검증되지 않은 아이디어도 실험을 통해 밀어붙이는 편이에요. 전문성을 살린 기술 창업에 강점이 있어요.",
    strength: "기술 전문성과 실행력",
    caution: "시장 검증 속도",
    field: "전문·과학·기술서비스, 정보통신",
    industryGroup: "전문 과학 및 기술 서비스업",
    keywords: ["기술", "AI", "딥테크", "정보통신", "IT", "스타트업"],
    data: [
      { value: `${industryRow("전문 과학 및 기술 서비스업").gradRate.toFixed(1)}%`, label: "대졸 이상 비율" },
      { value: `${industryRow("전문 과학 및 기술 서비스업").prepMonths.toFixed(1)}개월`, label: "평균 준비기간" },
      { value: `${industryRow("전문 과학 및 기술 서비스업").employedRate.toFixed(1)}%`, label: "창업 전 취업 비율" },
    ],
  },
  {
    key: "idea",
    name: "아이디어형",
    nameEn: "IDEATOR",
    desc: "콘텐츠와 서비스 기획에 재능이 있고, 사람들이 좋아할 만한 걸 알아채는 감각이 좋아요. 교육·콘텐츠·서비스 분야 창업에 잘 맞아요.",
    strength: "기획력과 트렌드 감각",
    caution: "수익 모델 구체화",
    field: "예술·스포츠·여가, 교육서비스",
    industryGroup: "교육 서비스업",
    keywords: ["콘텐츠", "아이디어", "교육", "서비스기획", "여성"],
    data: [
      { value: `${industryRow("교육 서비스업").femaleRate.toFixed(1)}%`, label: "여성 창업자 비율" },
      { value: `${industryRow("교육 서비스업").gradRate.toFixed(1)}%`, label: "대졸 이상 비율" },
      { value: `${industryRow("교육 서비스업").prepMonths.toFixed(1)}개월`, label: "평균 준비기간" },
    ],
  },
  {
    key: "mainstreet",
    name: "생계형자영업형",
    nameEn: "MAIN-STREET",
    desc: "발로 뛰는 실전 감각이 강하고, 손님·매장·현장을 직접 운영하는 걸 편하게 느껴요. 외식·도소매 같은 생활밀착 업종에 강점이 있어요.",
    strength: "현장 운영력",
    caution: "초기 자본 회수 기간",
    field: "숙박·음식점, 도소매",
    industryGroup: "숙박 및 음식점업",
    keywords: ["생계형", "소상공인", "외식", "도소매", "로컬", "자영업"],
    data: [
      { value: `${industryRow("숙박 및 음식점업").femaleRate.toFixed(1)}%`, label: "여성 창업자 비율" },
      { value: `${industryRow("숙박 및 음식점업").gradRate.toFixed(1)}%`, label: "대졸 이상 비율" },
      { value: `${industryRow("숙박 및 음식점업").prepMonths.toFixed(1)}개월`, label: "평균 준비기간" },
    ],
  },  
  {
    key: "career",
    name: "경력전환형",
    nameEn: "CAREER-SHIFTER",
    desc: "직장에서 쌓은 전문성과 현장 경험을 살려 창업으로 전환하려는 유형이에요. 제조·건설처럼 경력이 곧 진입장벽이 되는 업종에서 강점을 발휘해요.",
    strength: "경력 기반 전문성",
    caution: "직장인 마인드셋 전환",
    field: "제조·건설 등 경력 기반 업종",
    industryGroup: "제조업",
    keywords: ["제조", "건설", "경력", "전문서비스", "이직"],
    data: [
      { value: `${industryRow("제조업").employedRate.toFixed(1)}%`, label: "창업 전 취업 비율" },
      { value: `${industryRow("제조업").gradRate.toFixed(1)}%`, label: "대졸 이상 비율" },
      { value: `${industryRow("제조업").prepMonths.toFixed(1)}개월`, label: "평균 준비기간" },
    ],
  },
  {
    key: "comeback",
    name: "재도전형",
    nameEn: "COMEBACK",
    desc: "이전 창업·직장 경험에서 배운 것을 다음 도전에 적용하려는 유형이에요. 특정 업종보다 '회복탄력성'이 강점이라, 전체 창업 평균을 기준선 삼아 재도전 지원사업을 활용하기 좋아요.",
    strength: "회복탄력성과 학습 속도",
    caution: "이전 실패 요인 재점검",
    field: "재도전·재창업 전반",
    industryGroup: "전체 창업 생태계 평균",
    keywords: ["재도전", "재창업", "시니어", "회복"],
    data: [
      { value: `${mean(INDUSTRY_PROFILE.map((r) => r.gradRate)).toFixed(1)}%`, label: "평균 대졸 이상 비율" },
      { value: `${mean(INDUSTRY_PROFILE.map((r) => r.prepMonths)).toFixed(1)}개월`, label: "평균 준비기간" },
      { value: `${mean(INDUSTRY_PROFILE.map((r) => r.employedRate)).toFixed(1)}%`, label: "평균 창업 전 취업 비율" },
    ],
  },
];

export const STARTUP_TYPES_BY_KEY: Record<TypeKey, StartupTypeWithKeywords> = Object.fromEntries(
  STARTUP_TYPES.map((t) => [t.key, t]),
) as Record<TypeKey, StartupTypeWithKeywords>;
