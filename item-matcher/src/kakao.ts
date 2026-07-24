/** 카카오 공유 — Kakao JS SDK.
 *  VITE_KAKAO_JS_KEY(카카오 디벨로퍼스 JavaScript 키)가 있어야 동작.
 *  없으면 안내 메시지를 돌려주고, 호출부가 사용자에게 보여준다.
 */
const KAKAO_KEY: string = import.meta.env.VITE_KAKAO_JS_KEY ?? "";

interface KakaoSdk {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (opts: unknown) => void };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Kakao) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("카카오 SDK를 불러오지 못했어요."));
      };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

export function kakaoReady(): boolean {
  return KAKAO_KEY.length > 0;
}

/** 공고를 카카오톡으로 공유. 성공 시 null, 실패/미설정 시 안내 문자열 반환 */
export async function shareToKakao(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}): Promise<string | null> {
  if (!KAKAO_KEY) {
    return "카카오 공유는 카카오 앱 키(VITE_KAKAO_JS_KEY) 설정 후 활성화돼요.";
  }
  try {
    await loadSdk();
    const kakao = window.Kakao;
    if (!kakao) return "카카오 SDK 초기화에 실패했어요.";
    if (!kakao.isInitialized()) kakao.init(KAKAO_KEY);
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: opts.title,
        description: opts.description,
        imageUrl: opts.imageUrl ?? "",
        link: { webUrl: opts.url, mobileWebUrl: opts.url },
      },
      buttons: [{ title: "공고 보기", link: { webUrl: opts.url, mobileWebUrl: opts.url } }],
    });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "카카오 공유에 실패했어요.";
  }
}
