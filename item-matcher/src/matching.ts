import type { Announcement, MatchResult } from "./types";

/** 의미 없는 기능어 — 키워드로 취급하지 않음 */
const STOPWORDS = new Set([
  "그리고", "그래서", "하지만", "하는", "있는", "없는", "싶은", "싶습니다", "합니다",
  "있습니다", "없습니다", "입니다", "중입니다", "저는", "제가", "저희", "우리",
  "관련", "준비", "예정", "생각", "계획", "위한", "위해", "통해", "대한", "대해",
  "하고", "해서", "있어요", "해요", "같은", "이런", "그런", "어떤", "여러",
  "지금", "현재", "아직", "이제", "가장", "매우", "정말", "그냥",
  "중인", "중이에요", "중입니다", "만들고", "하려고", "싶어요", "싶어",
]);

/** 서술형 어미 — "예비창업자입니다" → "예비창업자", "준비하는" → "준비" */
const SUFFIXES = [
  "입니다", "이에요", "인데요", "예요", "에요", "이고", "이며", "인데",
  "하는", "하고", "해서", "하려는", "했던", "하기",
];

/** 도메인 동의어 — 사용자의 표현과 공고의 표현이 달라도 이어준다 */
const SYNONYMS: Record<string, string[]> = {
  ai: ["인공지능", "머신러닝", "딥러닝"],
  인공지능: ["ai", "머신러닝"],
  머신러닝: ["ai", "인공지능"],
  앱: ["모바일", "어플", "애플리케이션", "플랫폼"],
  모바일: ["앱", "플랫폼"],
  웹: ["플랫폼", "온라인"],
  플랫폼: ["온라인"],
  의료: ["헬스케어", "바이오", "건강", "병원"],
  헬스케어: ["의료", "바이오", "건강"],
  바이오: ["의료", "헬스케어"],
  번역: ["언어", "글로벌"],
  음식: ["식품", "외식", "푸드", "요식"],
  식품: ["음식", "푸드", "농식품"],
  푸드: ["식품", "음식", "외식"],
  카페: ["외식", "식품"],
  환경: ["친환경", "그린", "에코", "기후"],
  친환경: ["환경", "그린"],
  교육: ["에듀", "이러닝", "학습"],
  게임: ["콘텐츠"],
  콘텐츠: ["미디어", "영상"],
  영상: ["콘텐츠", "미디어"],
  이커머스: ["커머스", "쇼핑몰", "유통"],
  커머스: ["이커머스", "쇼핑몰", "유통"],
  쇼핑몰: ["커머스", "유통"],
  제조: ["제조업", "생산"],
  농업: ["농식품", "스마트팜", "농촌"],
  스마트팜: ["농업", "농식품"],
  핀테크: ["금융"],
  금융: ["핀테크"],
  관광: ["여행", "투어"],
  여행: ["관광"],
  글로벌: ["해외", "수출", "국제"],
  해외: ["글로벌", "수출"],
  수출: ["글로벌", "해외"],
  청년: ["청년창업"],
  대학생: ["청년", "대학"],
  여성: ["여성창업"],
  기술: ["r&d", "연구개발", "기술개발"],
  로봇: ["로보틱스", "자동화"],
  패션: ["의류", "디자인"],
  반려동물: ["펫", "반려"],
  펫: ["반려동물", "반려"],
  예비창업자: ["예비창업", "예비"],
  예비창업: ["예비창업자", "예비"],
  재창업: ["재도전"],
  재도전: ["재창업"],
};

/** 한국어 조사 꼬리 — "아이템을" → "아이템" 변형도 후보에 추가 */
const PARTICLES = ["은", "는", "이", "가", "을", "를", "에", "의", "로", "와", "과", "도", "만", "요"];

/** 사용자 입력에서 매칭용 키워드 추출 */
export function extractKeywords(text: string): string[] {
  const raw = text.toLowerCase().match(/[가-힣a-z0-9&+]+/g) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();

  function push(tok: string) {
    if (tok.length < 2 || STOPWORDS.has(tok) || seen.has(tok)) return;
    seen.add(tok);
    out.push(tok);
  }

  for (let tok of raw) {
    // 서술형 어미 제거: "예비창업자입니다" → "예비창업자"
    for (const suf of SUFFIXES) {
      if (tok.length > suf.length + 1 && tok.endsWith(suf)) {
        tok = tok.slice(0, -suf.length);
        break;
      }
    }
    // 조사 제거: "아이템을" → "아이템" (원형만 남긴다)
    if (tok.length >= 3 && /[가-힣]$/.test(tok) && PARTICLES.includes(tok.slice(-1))) {
      tok = tok.slice(0, -1);
    }
    push(tok);
  }
  return out;
}

interface Haystack {
  title: string;
  category: string;
  rest: string;
}

function haystackOf(n: Announcement): Haystack {
  return {
    title: (n.biz_pbanc_nm ?? "").toLowerCase(),
    category: `${n.supt_biz_clsfc ?? ""} ${n.industries.join(" ")}`.toLowerCase(),
    rest: [n.pbanc_ntrp_nm, n.sprv_inst, n.aply_trgt, n.supt_regin, n.biz_enyy, n.biz_trgt_age]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

/** 키워드 하나가 이 공고에 맞는지 — 동의어까지 보고 가중치 반환 (0이면 불일치) */
function keywordWeight(kw: string, hay: Haystack): number {
  const variants = [kw, ...(SYNONYMS[kw] ?? [])];
  let best = 0;
  for (const v of variants) {
    if (hay.title.includes(v)) best = Math.max(best, 3);
    else if (hay.category.includes(v)) best = Math.max(best, 2);
    else if (hay.rest.includes(v)) best = Math.max(best, 1);
  }
  return best;
}

/** 전 공고를 실시간 스코어링해 상위 매칭 반환 */
export function matchAnnouncements(
  text: string,
  announcements: Announcement[],
  limit = 30,
): { keywords: string[]; results: MatchResult[] } {
  const keywords = extractKeywords(text);
  if (keywords.length === 0) return { keywords, results: [] };

  const results: MatchResult[] = [];
  for (const n of announcements) {
    const hay = haystackOf(n);
    let score = 0;
    const matched: string[] = [];
    for (const kw of keywords) {
      const w = keywordWeight(kw, hay);
      if (w > 0) {
        score += w;
        matched.push(kw);
      }
    }
    if (score > 0) results.push({ notice: n, score, matched });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.notice.pbanc_rcpt_end_dt ?? "9999") < (b.notice.pbanc_rcpt_end_dt ?? "9999") ? -1 : 1;
  });
  return { keywords, results: results.slice(0, limit) };
}

/** "20260812" → 마감까지 남은 일수 (지났으면 음수) */
export function daysLeft(yyyymmdd: string | null): number | null {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null;
  const end = new Date(
    Number(yyyymmdd.slice(0, 4)),
    Number(yyyymmdd.slice(4, 6)) - 1,
    Number(yyyymmdd.slice(6, 8)),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}
