const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

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
