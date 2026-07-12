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
