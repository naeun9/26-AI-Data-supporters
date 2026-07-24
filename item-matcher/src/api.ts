import type { Announcement, AnnouncementDetail, Profile } from "./types";

/** 본진(창업메이트) 배포 백엔드를 그대로 사용 — CORS는 vercel.app 도메인 허용됨. */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? "https://26-ai-data-supporters.vercel.app";

let cache: Announcement[] | null = null;

/** KISED 데이터에 섞여 오는 HTML 엔티티(&apos; 등) 복원 */
function decodeEntities(s: string | null): string | null {
  if (!s) return s;
  return s
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (cache) return cache;
  const res = await fetch(`${API_BASE}/api/announcement/open`);
  if (!res.ok) throw new Error(`공고 API 오류: ${res.status}`);
  const data = (await res.json()) as { items: Announcement[] };
  cache = data.items.map((n) => ({
    ...n,
    biz_pbanc_nm: decodeEntities(n.biz_pbanc_nm) ?? n.biz_pbanc_nm,
    pbanc_ntrp_nm: decodeEntities(n.pbanc_ntrp_nm),
  }));
  return cache;
}

const detailCache = new Map<number, Promise<AnnouncementDetail | null>>();

/** 공고 상세 — 프로미스 캐시로 같은 공고 중복 요청 방지 */
export function fetchAnnouncementDetail(sn: number): Promise<AnnouncementDetail | null> {
  const hit = detailCache.get(sn);
  if (hit) return hit;
  const p = fetch(`${API_BASE}/api/announcement/${sn}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const d = (await res.json()) as AnnouncementDetail;
      d.biz_pbanc_nm = decodeEntities(d.biz_pbanc_nm) ?? d.biz_pbanc_nm;
      d.pbanc_ntrp_nm = decodeEntities(d.pbanc_ntrp_nm);
      d.pbanc_ctnt = decodeEntities(d.pbanc_ctnt);
      return d;
    })
    .catch(() => {
      detailCache.delete(sn);
      return null;
    });
  detailCache.set(sn, p);
  return p;
}

export async function fetchGoogleClientId(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/google/config`);
  if (!res.ok) return "";
  const data = (await res.json().catch(() => null)) as { client_id?: string } | null;
  return data?.client_id ?? "";
}

export async function googleLoginApi(accessToken: string): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail ?? "구글 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
  return { token: data.token, nickname: data.user.nickname, email: data.user.email };
}
