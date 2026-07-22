import { API_BASE as BASE } from "./base";

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

/** 백엔드가 detail에 담아주는 한국어 에러 메시지를 그대로 던진다. */
async function parseOrThrow(res: Response): Promise<AuthResult> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.detail ?? "서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
  return data as AuthResult;
}

export async function signupApi(email: string, password: string, nickname: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nickname }),
  });
  return parseOrThrow(res);
}

export async function loginApi(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(res);
}

/** 서버에 설정된 구글 OAuth 클라이언트 ID. 미설정이면 빈 문자열. */
export async function fetchGoogleClientId(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/google/config`);
  if (!res.ok) return "";
  const data = (await res.json().catch(() => null)) as { client_id?: string } | null;
  return data?.client_id ?? "";
}

/** 구글 액세스 토큰을 우리 서비스 JWT로 교환한다. */
export async function googleLoginApi(accessToken: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  return parseOrThrow(res);
}
