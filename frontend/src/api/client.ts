import type { IndustryProfileRow, Notice, RecommendResult, StartupType, TypeKey } from "../types";
import { STARTUP_TYPES, STARTUP_TYPES_BY_KEY } from "../data/startupTypes";
import { INDUSTRY_PROFILE } from "../data/industryProfile";
import { fetchAnnouncements, fetchAnnouncementDetail } from "./kised";
import type { AnnouncementDetail } from "./kised";
import {
  INDUSTRY_COUNT,
  INDUSTRY_DISTRIBUTION,
  AGE_DISTRIBUTION,
  CORP_VS_INDIVIDUAL,
  GRAD_OR_ABOVE_RATE,
  FEMALE_RATE,
  EMPLOYED_RATE,
  PREP_MONTHS_AVG,
  PREP_BY_AGE_GROUP,
} from "../data/dashboardStats";

function stripKeywords(type: (typeof STARTUP_TYPES)[number]): StartupType {
  const { keywords: _keywords, ...rest } = type;
  return rest;
}

export function getTypes(): Promise<StartupType[]> {
  return Promise.resolve(STARTUP_TYPES.map(stripKeywords));
}

export function getType(key: string): Promise<StartupType> {
  const type = STARTUP_TYPES_BY_KEY[key as TypeKey];
  if (!type) return Promise.reject(new Error(`unknown type: ${key}`));
  return Promise.resolve(stripKeywords(type));
}

function matchesType(notice: Notice, type: TypeKey): boolean {
  return STARTUP_TYPES_BY_KEY[type].keywords.some((kw) => notice.field.includes(kw));
}

function matchesStage(notice: Notice, stage: string): boolean {
  return notice.careerPeriods.includes(stage);
}

/** "전국" 공고는 지역 무관하게 항상 매칭 — 특정 지역을 설정한 사용자가 전국 대상 공고를 놓치지 않도록. */
function matchesRegion(notice: Notice, region: string): boolean {
  return notice.region === region || notice.region === "전국";
}

export interface MatchProfile {
  type?: TypeKey | null;
  stage?: string | null;
  region?: string | null;
}

/**
 * "내 맞춤" 매칭 — myType/myStage/myRegion 중 설정된 축만 AND로 검사하고, 미설정 축은 조건에서 제외.
 * 어느 축도 설정 안 됐으면 항상 false(호출부에서 "축 없음" 상태를 따로 처리해야 함).
 */
export function matchesProfile(notice: Notice, profile: MatchProfile): boolean {
  const hasAnyCriteria = Boolean(profile.type || profile.stage || profile.region);
  if (!hasAnyCriteria) return false;
  if (profile.type && STARTUP_TYPES_BY_KEY[profile.type] && !matchesType(notice, profile.type)) return false;
  if (profile.stage && !matchesStage(notice, profile.stage)) return false;
  if (profile.region && !matchesRegion(notice, profile.region)) return false;
  return true;
}

/** notices 전체에서 matchesProfile을 만족하는 것만 recommended: true로 표시해 반환. 축이 하나도 없으면 빈 배열. */
export function getMatchedNotices(notices: Notice[], profile: MatchProfile): Notice[] {
  return notices.filter((n) => matchesProfile(n, profile)).map((n) => ({ ...n, recommended: true }));
}

export async function getNotices(params?: { field?: string; region?: string; type?: string }): Promise<Notice[]> {
  let notices = await fetchAnnouncements();
  if (params?.field) notices = notices.filter((n) => n.field.includes(params.field!));
  if (params?.region) notices = notices.filter((n) => n.region === params.region);

  const type = params?.type as TypeKey | undefined;
  if (type && STARTUP_TYPES_BY_KEY[type]) {
    return notices.map((n) => ({ ...n, recommended: matchesType(n, type) }));
  }
  return notices.map((n) => ({ ...n, recommended: false }));
}

export function getIndustryProfile(): Promise<IndustryProfileRow[]> {
  return Promise.resolve(INDUSTRY_PROFILE);
}

export function getNoticeDetail(sn: string): Promise<AnnouncementDetail> {
  return fetchAnnouncementDetail(sn);
}

export interface DashboardStat {
  value: string;
  label: string;
}

export interface DashboardData {
  statStrip: DashboardStat[];
  corpVsIndividual: { individual: number; corporate: number };
  industryDistribution: { industry: string; companies: number; share: number }[];
  ageDistribution: { label: string; companies: number }[];
  education: { gradOrAbove: number; belowGrad: number };
  gender: { male: number; female: number };
  employment: { employed: number; notEmployed: number };
  prepByAgeGroup: { label: string; months: number }[];
}

/** Computed from the KISED 창업진흥원 통계 CSV 6종 (frontend/src/data/csv/ -> generated/ -> dashboardStats.ts). */
export function getDashboard(): Promise<DashboardData> {
  return Promise.resolve({
    statStrip: [
      { value: String(INDUSTRY_COUNT), label: "업종 분류" },
      { value: `${PREP_MONTHS_AVG.toFixed(1)}개월`, label: "평균 준비기간" },
      { value: `${GRAD_OR_ABOVE_RATE.toFixed(1)}%`, label: "평균 대졸 이상 비율" },
    ],
    corpVsIndividual: {
      individual: Math.round(CORP_VS_INDIVIDUAL.individual * 10) / 10,
      corporate: Math.round(CORP_VS_INDIVIDUAL.corporate * 10) / 10,
    },
    industryDistribution: INDUSTRY_DISTRIBUTION.map((r) => ({
      industry: r.industry,
      companies: r.companies,
      share: r.share,
    })),
    ageDistribution: AGE_DISTRIBUTION,
    education: {
      gradOrAbove: Math.round(GRAD_OR_ABOVE_RATE * 10) / 10,
      belowGrad: Math.round((100 - GRAD_OR_ABOVE_RATE) * 10) / 10,
    },
    gender: { male: Math.round((100 - FEMALE_RATE) * 10) / 10, female: Math.round(FEMALE_RATE * 10) / 10 },
    employment: {
      employed: Math.round(EMPLOYED_RATE * 10) / 10,
      notEmployed: Math.round((100 - EMPLOYED_RATE) * 10) / 10,
    },
    prepByAgeGroup: PREP_BY_AGE_GROUP,
  });
}

export async function recommend(body: { type?: string; query?: string; limit?: number }): Promise<RecommendResult> {
  const limit = body.limit ?? 4;
  const notices = await fetchAnnouncements();

  if (body.type) {
    const type = STARTUP_TYPES_BY_KEY[body.type as TypeKey];
    if (!type) throw new Error(`unknown type: ${body.type}`);
    let matched = notices.filter((n) => matchesType(n, type.key));
    let reasonKeywords = type.keywords;
    if (matched.length === 0) {
      matched = notices;
      reasonKeywords = [];
    }
    const ranked = [...matched].sort((a, b) => a.ddayNum - b.ddayNum).slice(0, limit);
    return { notices: ranked.map((n) => ({ ...n, recommended: true })), reasonKeywords: reasonKeywords.slice(0, 3) };
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    const ranked = [...notices].sort((a, b) => a.ddayNum - b.ddayNum).slice(0, limit);
    return { notices: ranked.map((n) => ({ ...n, recommended: false })), reasonKeywords: [] };
  }

  const tokens = query.replace(/,/g, " ").split(/\s+/).filter((tok) => tok.length >= 2);
  const scored = notices
    .map((n) => {
      const haystack = `${n.title} ${n.org} ${n.field} ${n.target} ${n.region}`;
      const matchedTokens = tokens.filter((tok) => haystack.includes(tok));
      return { notice: n, score: matchedTokens.length, matchedTokens };
    })
    .filter((s) => s.score > 0);

  if (scored.length === 0) {
    const ranked = [...notices].sort((a, b) => a.ddayNum - b.ddayNum).slice(0, limit);
    return { notices: ranked.map((n) => ({ ...n, recommended: false })), reasonKeywords: [] };
  }

  scored.sort((a, b) => b.score - a.score || a.notice.ddayNum - b.notice.ddayNum);
  const top = scored.slice(0, limit);
  const reasonKeywords = Array.from(new Set(top.flatMap((s) => s.matchedTokens))).sort();
  return {
    notices: top.map((s) => ({ ...s.notice, recommended: true })),
    reasonKeywords: reasonKeywords.slice(0, 3),
  };
}
