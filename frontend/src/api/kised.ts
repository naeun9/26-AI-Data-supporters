import type { Notice, Urgency } from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

interface RawAnnouncement {
  pbanc_sn: number;
  biz_pbanc_nm: string;
  pbanc_ntrp_nm: string | null;
  sprv_inst: string | null;
  supt_biz_clsfc: string | null;
  supt_regin: string | null;
  aply_trgt: string | null;
  biz_enyy: string | null;
  pbanc_rcpt_end_dt: string | null;
  detl_pg_url: string | null;
}

interface RawAnnouncementDetail extends RawAnnouncement {
  pbanc_rcpt_bgng_dt: string | null;
  pbanc_ctnt: string | null;
  aply_excl_trgt_ctnt: string | null;
  aply_mthd_vst_rcpt_istc: string | null;
  aply_mthd_pssr_rcpt_istc: string | null;
  aply_mthd_fax_rcpt_istc: string | null;
  aply_mthd_eml_rcpt_istc: string | null;
  aply_mthd_onli_rcpt_istc: string | null;
  aply_mthd_etc_istc: string | null;
  biz_gdnc_url: string | null;
  biz_aply_url: string | null;
  prch_cnpl_no: string | null;
  biz_prch_dprt_nm: string | null;
}

/** Fixed filter option list for NoticesPage — keep in sync with clusterStage below. */
export const STAGE_GROUPS = ["예비창업자", "기존 창업자"] as const;

/** biz_enyy real values (창업기간): "예비창업자", "1년미만"~"10년미만" — 예비창업자 포함 여부로만 2분할. */
function clusterStage(bizEnyy: string | null): string {
  const tokens = (bizEnyy ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return tokens.some((t) => t.includes("예비창업자")) ? "예비창업자" : "기존 창업자";
}

const PALETTE = [
  { logoBg: "#eef3fd", logoInk: "#3b6fe0" },
  { logoBg: "#fdecec", logoInk: "#c33a3f" },
  { logoBg: "#eafaf1", logoInk: "#1a9e6b" },
  { logoBg: "#fdf3e2", logoInk: "#b26a00" },
  { logoBg: "#f3eefd", logoInk: "#7c3bd6" },
  { logoBg: "#fdeef7", logoInk: "#c93b8f" },
];

function paletteFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function shortTarget(aplyTrgt: string | null) {
  const parts = (aplyTrgt ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "제한없음";
  if (parts.length <= 2) return parts.join(", ");
  return `${parts.slice(0, 2).join(", ")} 외 ${parts.length - 2}`;
}

function parseKisedDate(value: string | null): Date | null {
  if (!value || value.length !== 8) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const d = new Date(year, month - 1, day, 23, 59, 59);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeDday(endDate: Date | null): { dday: string; ddayNum: number; urgency: Urgency } {
  if (!endDate) return { dday: "상시", ddayNum: 999, urgency: "none" };
  const diffMs = endDate.getTime() - Date.now();
  const ddayNum = Math.max(0, Math.ceil(diffMs / 86_400_000));
  const dday = ddayNum === 0 ? "D-day" : `D-${ddayNum}`;
  const urgency: Urgency = ddayNum <= 5 ? "hot" : ddayNum <= 14 ? "warn" : "none";
  return { dday, ddayNum, urgency };
}

function mapAnnouncement(raw: RawAnnouncement): Notice {
  const id = String(raw.pbanc_sn);
  const org = raw.pbanc_ntrp_nm || raw.sprv_inst || "창업진흥원";
  const region = raw.supt_regin || "전국";
  const field = raw.supt_biz_clsfc || "기타";
  const target = shortTarget(raw.aply_trgt);
  const stage = clusterStage(raw.biz_enyy);
  const { dday, ddayNum, urgency } = computeDday(parseKisedDate(raw.pbanc_rcpt_end_dt));
  const palette = paletteFor(region);

  return {
    id,
    title: raw.biz_pbanc_nm,
    org,
    logo: region,
    logoBg: palette.logoBg,
    logoInk: palette.logoInk,
    meta: `${region} · ${target} · ${org}`,
    dday,
    ddayNum,
    urgency,
    field,
    region,
    target,
    stage,
    recommended: false,
  };
}

/** "20260710" -> "2026.07.10" (형식이 안 맞으면 원본 그대로). */
function formatKisedDate(value: string | null): string | null {
  if (!value || value.length !== 8) return value ?? null;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

export interface ApplyMethod {
  label: string;
  value: string;
}

export interface AnnouncementDetail {
  id: string;
  title: string;
  org: string;
  logo: string;
  logoBg: string;
  logoInk: string;
  meta: string;
  region: string;
  target: string;
  /** 신청대상 원문 전체 (목록 meta용 target은 축약돼있어서 상세 요약 카드는 이걸 씀). */
  applyTargetFull: string;
  stage: string;
  /** 창업기간(biz_enyy) 원문 전체, 예: "예비창업자, 1년미만". */
  careerPeriod: string;
  field: string;
  dday: string;
  ddayNum: number;
  urgency: Urgency;
  bgngDateLabel: string | null;
  endDateLabel: string | null;
  content: string | null;
  exclTarget: string | null;
  applyMethods: ApplyMethod[];
  guidanceUrl: string | null;
  applyUrl: string | null;
  detailUrl: string | null;
  contact: string | null;
  department: string | null;
}

const APPLY_METHOD_LABELS: { key: keyof RawAnnouncementDetail; label: string }[] = [
  { key: "aply_mthd_onli_rcpt_istc", label: "온라인" },
  { key: "aply_mthd_eml_rcpt_istc", label: "이메일" },
  { key: "aply_mthd_vst_rcpt_istc", label: "방문" },
  { key: "aply_mthd_pssr_rcpt_istc", label: "우편" },
  { key: "aply_mthd_fax_rcpt_istc", label: "팩스" },
  { key: "aply_mthd_etc_istc", label: "기타" },
];

function mapAnnouncementDetail(raw: RawAnnouncementDetail): AnnouncementDetail {
  const id = String(raw.pbanc_sn);
  const org = raw.pbanc_ntrp_nm || raw.sprv_inst || "창업진흥원";
  const region = raw.supt_regin || "전국";
  const field = raw.supt_biz_clsfc || "기타";
  const target = shortTarget(raw.aply_trgt);
  const stage = clusterStage(raw.biz_enyy);
  const { dday, ddayNum, urgency } = computeDday(parseKisedDate(raw.pbanc_rcpt_end_dt));
  const palette = paletteFor(region);
  const applyMethods = APPLY_METHOD_LABELS.filter(({ key }) => raw[key]).map(({ key, label }) => ({
    label,
    value: raw[key] as string,
  }));

  return {
    id,
    title: raw.biz_pbanc_nm,
    org,
    logo: region,
    logoBg: palette.logoBg,
    logoInk: palette.logoInk,
    meta: `${region} · ${target} · ${org}`,
    region,
    target,
    applyTargetFull: raw.aply_trgt || "제한없음",
    stage,
    careerPeriod: raw.biz_enyy || "제한없음",
    field,
    dday,
    ddayNum,
    urgency,
    bgngDateLabel: formatKisedDate(raw.pbanc_rcpt_bgng_dt),
    endDateLabel: formatKisedDate(raw.pbanc_rcpt_end_dt),
    content: raw.pbanc_ctnt,
    exclTarget: raw.aply_excl_trgt_ctnt,
    applyMethods,
    guidanceUrl: raw.biz_gdnc_url,
    applyUrl: raw.biz_aply_url,
    detailUrl: raw.detl_pg_url,
    contact: raw.prch_cnpl_no,
    department: raw.biz_prch_dprt_nm,
  };
}

const detailCache = new Map<string, Promise<AnnouncementDetail>>();

/** 공고 상세. 백엔드가 목록과 같은 캐시(KISED 재호출 없음)에서 pbanc_sn으로 찾아 돌려준다.
 * 세션 내 같은 공고 재조회는 여기서 한 번 더 캐시. */
export function fetchAnnouncementDetail(sn: string): Promise<AnnouncementDetail> {
  let entry = detailCache.get(sn);
  if (!entry) {
    entry = fetch(`${BASE}/api/announcement/${sn}`)
      .then((res) => {
        if (res.status === 404) throw new Error("NOT_FOUND");
        if (!res.ok) throw new Error(`announcement detail fetch failed: ${res.status}`);
        return res.json() as Promise<RawAnnouncementDetail>;
      })
      .then(mapAnnouncementDetail)
      .catch((err) => {
        detailCache.delete(sn);
        throw err;
      });
    detailCache.set(sn, entry);
  }
  return entry;
}

let cache: Promise<Notice[]> | null = null;

/**
 * 모집중 K-Startup 공고 목록. 백엔드(/api/announcement/open)가 KISED 전량(약 3만 건)을
 * 마감일 기준으로 걸러서 필요한 필드만 slim하게 내려준다 (서버 30분 캐시).
 * 세션 캐시는 여기서 한 번 더 — 페이지 이동할 때마다 재요청하지 않도록.
 */
export function fetchAnnouncements(): Promise<Notice[]> {
  if (!cache) {
    cache = fetch(`${BASE}/api/announcement/open`)
      .then((res) => {
        if (!res.ok) throw new Error(`announcement fetch failed: ${res.status}`);
        return res.json() as Promise<{ items: RawAnnouncement[] }>;
      })
      .then((data) => data.items.filter((raw) => raw.pbanc_sn && raw.biz_pbanc_nm).map(mapAnnouncement))
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}
