import { ENY_BUSINESS_GENERAL } from "./generated/enyBusinessGeneral";
import { FORM_BUSINESS_GENERAL } from "./generated/formBusinessGeneral";
import { GENDER } from "./generated/gender";
import { EDUCATION, gradOrAboveRate } from "./generated/education";
import { PREP_TIME } from "./generated/prepTime";
import { EMPLOYMENT } from "./generated/employment";

/** 업종 18행 (중복 없는 전체 스냅샷) — 법인/개인 비율, 업종 분포, 가중평균의 기준 모집단. */
const INDUSTRY_ROWS = FORM_BUSINESS_GENERAL.filter((r) => r.category === "업종");
const TOTAL_COMPANIES = INDUSTRY_ROWS.reduce((sum, r) => sum + r.companies, 0);
const INDUSTRY_WEIGHT = new Map(INDUSTRY_ROWS.map((r) => [r.label, r.companies]));

export interface IndustryShare {
  industry: string;
  companies: number;
  share: number;
}

/** 업종별 기업수 상위 10개 (형태_일반현황 CSV, 업종 행 기준). */
export const INDUSTRY_DISTRIBUTION: IndustryShare[] = [...INDUSTRY_ROWS]
  .sort((a, b) => b.companies - a.companies)
  .slice(0, 10)
  .map((r) => ({ industry: r.label, companies: r.companies, share: (r.companies / TOTAL_COMPANIES) * 100 }));

/** 개인 vs 법인 비율 (업종 18행 합계 기준 — 업력 행은 같은 모집단의 다른 절단이라 합산해도 동일). */
export const CORP_VS_INDIVIDUAL = (() => {
  const individual = INDUSTRY_ROWS.reduce((s, r) => s + r.individual, 0);
  const corporate = INDUSTRY_ROWS.reduce((s, r) => s + r.corporate, 0);
  const total = individual + corporate;
  return { individual: (individual / total) * 100, corporate: (corporate / total) * 100 };
})();

export interface AgeBucket {
  label: string;
  companies: number;
}

/** 창업 연차별(1~7년) 기업 분포 = 업력_일반현황 CSV의 기업형태(개인+법인) 행 합계. */
export const AGE_DISTRIBUTION: AgeBucket[] = (() => {
  const byYear = [0, 0, 0, 0, 0, 0, 0];
  for (const r of ENY_BUSINESS_GENERAL) {
    if (r.category !== "기업형태") continue;
    r.years.forEach((v, i) => {
      byYear[i] += v;
    });
  }
  return byYear.map((companies, i) => ({ label: `${i + 1}년차`, companies }));
})();

/** 업종별 기업수(형태_일반현황)로 가중평균 — 18개 업종 단순평균보다 정밀한 전국 집계치. */
function weightedByIndustry<T>(rows: T[], getIndustry: (r: T) => string, getValue: (r: T) => number): number {
  let sumWeighted = 0;
  let sumWeight = 0;
  for (const row of rows) {
    const weight = INDUSTRY_WEIGHT.get(getIndustry(row));
    if (weight === undefined) continue;
    sumWeighted += getValue(row) * weight;
    sumWeight += weight;
  }
  return sumWeight > 0 ? sumWeighted / sumWeight : 0;
}

const educationIndustryRows = EDUCATION.filter((r) => r.category === "업종");
const genderIndustryRows = GENDER.filter((r) => r.category === "업종");
const employmentIndustryRows = EMPLOYMENT.filter((r) => r.category === "업종");
const prepIndustryRows = PREP_TIME.filter((r) => r.category === "업종");

export const GRAD_OR_ABOVE_RATE = weightedByIndustry(educationIndustryRows, (r) => r.label, gradOrAboveRate);
export const FEMALE_RATE = weightedByIndustry(genderIndustryRows, (r) => r.label, (r) => r.female);
export const EMPLOYED_RATE = weightedByIndustry(employmentIndustryRows, (r) => r.label, (r) => r.employed);
export const PREP_MONTHS_AVG = weightedByIndustry(prepIndustryRows, (r) => r.label, (r) => r.months);

export interface PrepByAge {
  label: string;
  months: number;
}

/** 창업자 연령대별 준비기간 (준비기간 CSV의 "창업자 연령" 행, 실데이터). */
export const PREP_BY_AGE_GROUP: PrepByAge[] = PREP_TIME.filter((r) => r.category === "창업자 연령").map((r) => ({
  label: r.label,
  months: r.months,
}));

export const INDUSTRY_COUNT = INDUSTRY_ROWS.length;
