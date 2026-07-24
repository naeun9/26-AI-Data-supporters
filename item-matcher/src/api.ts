import type { Announcement, Profile } from "./types";

/** 본진(창업메이트) 배포 백엔드를 그대로 사용 — CORS는 vercel.app 도메인 허용됨. */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? "https://26-ai-data-supporters.vercel.app";

let cache: Announcement[] | null = null;

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (cache) return cache;
  const res = await fetch(`${API_BASE}/api/announcement/open`);
  if (!res.ok) throw new Error(`공고 API 오류: ${res.status}`);
  const data = (await res.json()) as { items: Announcement[] };
  cache = data.items;
  return cache;
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
