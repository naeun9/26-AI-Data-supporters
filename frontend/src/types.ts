export type TypeKey = "tech" | "idea" | "mainstreet" | "career" | "comeback";

export type Urgency = "hot" | "warn" | "none";

export interface Notice {
  id: string;
  title: string;
  org: string;
  logo: string;
  logoBg: string;
  logoInk: string;
  meta: string;
  dday: string;
  ddayNum: number;
  urgency: Urgency;
  field: string;
  region: string;
  target: string;
  stage: string;
  /** biz_enyy 토큰 목록(창업기간) — myStage 기반 맞춤 매칭용. */
  careerPeriods: string[];
  /** biz_trgt_age에 "만 40세 이상"이 없는(=39세 이하로 국한된) 공고. 청년창업 필터용. */
  youthTargeted: boolean;
  /** KISED 원본엔 없는 필드 — 제목+내용 키워드로 백엔드가 부가 태깅한 업종(복수 가능). */
  industries: string[];
  recommended?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface StartupType {
  key: TypeKey;
  name: string;
  nameEn: string;
  desc: string;
  strength: string;
  caution: string;
  field: string;
  industryGroup: string;
  data: StatItem[];
}

export interface QuizOption {
  key: "A" | "B" | "C" | "D";
  label: string;
  type: TypeKey;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
}

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  recommendation?: {
    notices: Notice[];
    reason: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  sub: string;
  messages: ChatMessage[];
}

export interface IndustryProfileRow {
  industry: string;
  gradRate: number;
  femaleRate: number;
  employedRate: number;
  prepMonths: number;
}

export interface RecommendResult {
  notices: Notice[];
  reasonKeywords: string[];
}
