/** Google Identity Services 로더 + 액세스 토큰 팝업 (본진 frontend/src/api/google.ts와 동일 로직). */

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("구글 로그인 스크립트를 불러오지 못했어요."));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export async function getGoogleAccessToken(clientId: string): Promise<string> {
  await loadGisScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("구글 로그인 모듈을 초기화하지 못했어요.");

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (resp) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error("구글 로그인이 취소되었어요."));
      },
      error_callback: () => reject(new Error("구글 로그인 창이 닫혔어요. 다시 시도해 주세요.")),
    });
    client.requestAccessToken();
  });
}
