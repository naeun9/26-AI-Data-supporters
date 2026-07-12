import { toAbsoluteHref } from "../utils/url";
import { STARTUP_TYPES_BY_KEY } from "../data/startupTypes";
import type { TypeKey } from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

interface RawEducation {
  lctr_nm: string;
  lctr_istc: string | null;
  kywrd: string | null;
  lctr_pg_url: string | null;
  play_time: number | null;
  view_cnt: number | null;
  lctr_mclss_cd: string | null;
  reg_dt: string | null;
}

/** lctr_mclss_cd(중분류 코드) — KISED가 라벨을 안 줘서 제목 역추적으로 우리가 붙인 이름.
 * 05는 결번(실제 데이터에 없음). */
export const EDU_TOPIC_LABELS: Record<string, string> = {
  LCTR_MCLSS_CD_01: "창업가정신·리더십",
  LCTR_MCLSS_CD_02: "비즈니스모델·아이템 검증",
  LCTR_MCLSS_CD_03: "마케팅·영업·조직관리",
  LCTR_MCLSS_CD_04: "투자유치·재무",
  LCTR_MCLSS_CD_06: "기술창업·트렌드",
};

export const EDU_TOPIC_ORDER = Object.keys(EDU_TOPIC_LABELS);

export interface EducationLecture {
  id: string;
  title: string;
  summary: string;
  href: string | null;
  minutes: number;
  viewCount: number;
  topicCode: string;
  topicLabel: string;
  regDate: string | null;
  /** 원본 키워드(콤마 나열) — 유형 매칭용, 화면엔 안 씀. */
  keywordsRaw: string;
}

/** "<br>" 계열 태그는 줄바꿈으로, 그 외 태그는 제거. dangerouslySetInnerHTML은 쓰지 않고
 * 순수 텍스트로 만들어 React가 그대로 escape해서 렌더하게 한다(XSS 방지). */
function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function mapEducation(raw: RawEducation): EducationLecture {
  const topicCode = raw.lctr_mclss_cd ?? "";
  return {
    id: raw.lctr_pg_url || raw.lctr_nm,
    title: raw.lctr_nm,
    summary: stripHtml(raw.lctr_istc ?? ""),
    href: raw.lctr_pg_url ? toAbsoluteHref(raw.lctr_pg_url) : null,
    minutes: Math.max(1, Math.round((raw.play_time ?? 0) / 60)),
    viewCount: raw.view_cnt ?? 0,
    topicCode,
    topicLabel: EDU_TOPIC_LABELS[topicCode] ?? "기타",
    regDate: raw.reg_dt,
    keywordsRaw: raw.kywrd ?? "",
  };
}

const MATCH_MIN = 3;
const MATCH_TARGET = 6;

/** 공고 추천(matchesType)과 같은 방식 — 유형 키워드가 kywrd 또는 제목에 포함되면 매칭. */
function matchesEducationType(lecture: EducationLecture, type: TypeKey): boolean {
  const haystack = `${lecture.keywordsRaw} ${lecture.title}`;
  return STARTUP_TYPES_BY_KEY[type].keywords.some((kw) => haystack.includes(kw));
}

export interface MyTypeEducationResult {
  lectures: EducationLecture[];
  /** 매칭이 3건 미만이라 조회수 상위로 대체한 경우. */
  isFallback: boolean;
}

/** "내 유형 추천 교육" — 매칭 3건 미만이면 억지로 채우지 않고 조회수 상위로 자연스럽게 대체. */
export function getMyTypeEducation(lectures: EducationLecture[], type: TypeKey): MyTypeEducationResult {
  const matched = lectures.filter((l) => matchesEducationType(l, type));
  if (matched.length >= MATCH_MIN) {
    return {
      lectures: [...matched].sort((a, b) => b.viewCount - a.viewCount).slice(0, MATCH_TARGET),
      isFallback: false,
    };
  }
  return {
    lectures: [...lectures].sort((a, b) => b.viewCount - a.viewCount).slice(0, MATCH_TARGET),
    isFallback: true,
  };
}

let cache: Promise<EducationLecture[]> | null = null;

/** 창업에듀 강의 전량(338건, 백엔드 /api/education/list가 서버 캐시). 세션 내 재요청 방지용 캐시. */
export function fetchEducationLectures(): Promise<EducationLecture[]> {
  if (!cache) {
    cache = fetch(`${BASE}/api/education/list`)
      .then((res) => {
        if (!res.ok) throw new Error(`education fetch failed: ${res.status}`);
        return res.json() as Promise<{ items: RawEducation[] }>;
      })
      .then((data) => data.items.filter((raw) => raw.lctr_nm).map(mapEducation))
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}
