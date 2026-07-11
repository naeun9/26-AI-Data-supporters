// 창업진흥원 통계 CSV(frontend/src/data/csv/) -> 타입 있는 TS 데이터(frontend/src/data/generated/) 변환.
// 실행: npm run build:stats
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.join(__dirname, "..", "src", "data", "csv");
const OUT_DIR = path.join(__dirname, "..", "src", "data", "generated");

const HEADER = `// 자동 생성 파일 — 직접 수정하지 말 것.
// 원본: frontend/src/data/csv/ (CP949 인코딩) — \`npm run build:stats\`로 재생성됩니다.
`;

function readCsvRows(filename) {
  const buf = readFileSync(path.join(CSV_DIR, filename));
  const text = new TextDecoder("euc-kr").decode(buf);
  return text
    .split(/\r\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(","));
}

function num(s) {
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`숫자로 파싱 실패: "${s}"`);
  return n;
}

function tsString(s) {
  return JSON.stringify(s);
}

function writeGenerated(filename, body) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, filename), HEADER + body, "utf-8");
  console.log(`wrote src/data/generated/${filename}`);
}

// ── 1) 업력 일반현황: 구분별(1), 구분별(2), 기업수, 1~7년 ──────────────
function buildEnyBusinessGeneral() {
  const rows = readCsvRows("창업진흥원_창업기업 업력 일반현황_20260609.csv").slice(1);
  const data = rows.map(([cat, label, companies, y1, y2, y3, y4, y5, y6, y7]) => ({
    category: cat,
    label,
    companies: num(companies),
    years: [num(y1), num(y2), num(y3), num(y4), num(y5), num(y6), num(y7)],
  }));

  const body = `
export interface EnyBusinessGeneralRow {
  category: "업종" | "기업형태";
  label: string;
  companies: number;
  /** 업력 1~7년차 기업수 */
  years: [number, number, number, number, number, number, number];
}

export const ENY_BUSINESS_GENERAL: EnyBusinessGeneralRow[] = [
${data
  .map(
    (r) =>
      `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, companies: ${r.companies}, years: [${r.years.join(", ")}] },`,
  )
  .join("\n")}
];
`;
  writeGenerated("enyBusinessGeneral.ts", body);
  return data;
}

// ── 2) 형태 일반현황: 구분별(1), 구분별(2), 기업수, 개인, 법인 ──────────
function buildFormBusinessGeneral() {
  const rows = readCsvRows("창업진흥원_창업기업 형태 일반현황_20260609.csv").slice(1);
  const data = rows.map(([cat, label, companies, individual, corporate]) => ({
    category: cat,
    label,
    companies: num(companies),
    individual: num(individual),
    corporate: num(corporate),
  }));

  const body = `
export interface FormBusinessGeneralRow {
  category: "업력" | "업종";
  label: string;
  companies: number;
  individual: number;
  corporate: number;
}

export const FORM_BUSINESS_GENERAL: FormBusinessGeneralRow[] = [
${data
  .map(
    (r) =>
      `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, companies: ${r.companies}, individual: ${r.individual}, corporate: ${r.corporate} },`,
  )
  .join("\n")}
];
`;
  writeGenerated("formBusinessGeneral.ts", body);
  return data;
}

// ── 3) 성별: 구분별(1), 구분별(2), 남성, 여성 ───────────────────────────
function buildGender() {
  const rows = readCsvRows("창업진흥원_창업기업 창업자 성별 정보_20260609.csv").slice(1);
  const data = rows.map(([cat, label, male, female]) => ({
    category: cat,
    label,
    male: num(male),
    female: num(female),
  }));

  const body = `
export type GenderCategory = "업력" | "업종" | "기업형태" | "창업자 연령";

export interface GenderRow {
  category: GenderCategory;
  label: string;
  male: number;
  female: number;
}

export const GENDER: GenderRow[] = [
${data
  .map((r) => `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, male: ${r.male}, female: ${r.female} },`)
  .join("\n")}
];
`;
  writeGenerated("gender.ts", body);
  return data;
}

// ── 4) 학력: 구분별(1), 구분별(2), 중졸이하, 고졸, 전문대졸, 대졸, 석사, 박사 ──
function buildEducation() {
  const rows = readCsvRows("창업진흥원_창업기업 창업자 학력 정보_20260609.csv").slice(1);
  const data = rows.map(([cat, label, belowMiddle, highSchool, college2yr, college4yr, master, doctor]) => ({
    category: cat,
    label,
    belowMiddle: num(belowMiddle),
    highSchool: num(highSchool),
    college2yr: num(college2yr),
    college4yr: num(college4yr),
    master: num(master),
    doctor: num(doctor),
  }));

  const body = `
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
${data
  .map(
    (r) =>
      `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, belowMiddle: ${r.belowMiddle}, highSchool: ${r.highSchool}, college2yr: ${r.college2yr}, college4yr: ${r.college4yr}, master: ${r.master}, doctor: ${r.doctor} },`,
  )
  .join("\n")}
];
`;
  writeGenerated("education.ts", body);
  return data;
}

// ── 5) 준비기간: 구분별(1), 구분별(2), 창업까지 소요기간(개월) ──────────
function buildPrepTime() {
  const rows = readCsvRows("창업진흥원_창업기업의 준비기간 현황_20260609.csv").slice(1);
  const data = rows.map(([cat, label, months]) => ({
    category: cat,
    label,
    months: num(months),
  }));

  const body = `
export type PrepTimeCategory = "업력" | "업종" | "기업형태" | "창업자 성별" | "창업자 연령";

export interface PrepTimeRow {
  category: PrepTimeCategory;
  label: string;
  /** 창업까지 소요기간 (개월) */
  months: number;
}

export const PREP_TIME: PrepTimeRow[] = [
${data.map((r) => `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, months: ${r.months} },`).join("\n")}
];
`;
  writeGenerated("prepTime.ts", body);
  return data;
}

// ── 6) 취업상태: 구분별(1), 구분별(2), 취업상태, 미취업상태 ────────────
function buildEmployment() {
  const rows = readCsvRows("창업진흥원_창업자 취업상태 정보_20260609.csv").slice(1);
  const data = rows.map(([cat, label, employed, notEmployed]) => ({
    category: cat,
    label,
    employed: num(employed),
    notEmployed: num(notEmployed),
  }));

  const body = `
export type EmploymentCategory = "업력" | "업종" | "기업형태" | "창업자 성별" | "창업자 연령";

export interface EmploymentRow {
  category: EmploymentCategory;
  label: string;
  employed: number;
  notEmployed: number;
}

export const EMPLOYMENT: EmploymentRow[] = [
${data
  .map(
    (r) =>
      `  { category: ${tsString(r.category)}, label: ${tsString(r.label)}, employed: ${r.employed}, notEmployed: ${r.notEmployed} },`,
  )
  .join("\n")}
];
`;
  writeGenerated("employment.ts", body);
  return data;
}

const eny = buildEnyBusinessGeneral();
const form = buildFormBusinessGeneral();
const gender = buildGender();
const education = buildEducation();
const prepTime = buildPrepTime();
const employment = buildEmployment();

writeGenerated(
  "index.ts",
  `
export * from "./enyBusinessGeneral";
export * from "./formBusinessGeneral";
export * from "./gender";
export * from "./education";
export * from "./prepTime";
export * from "./employment";
`,
);

console.log("\n행 수:", {
  enyBusinessGeneral: eny.length,
  formBusinessGeneral: form.length,
  gender: gender.length,
  education: education.length,
  prepTime: prepTime.length,
  employment: employment.length,
});
