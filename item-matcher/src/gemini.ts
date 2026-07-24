/** Gemini 기반 아이템 분석 — 키워드 추출 + 분야 판별 + 캐릭터 멘트 생성.
 *  입력에 링크가 있으면 url_context 도구로 실제 페이지 내용까지 읽는다.
 *  실패하면 null을 돌려주고, 호출부가 로컬 키워드 매칭으로 폴백한다.
 */

// 빌드 시 VITE_GEMINI_KEY 환경변수로 주입 (GitHub 푸시 보호 때문에 소스 하드코딩 불가.
// 로컬: item-matcher/.env.local / 배포: Vercel 환경변수. 키가 없으면 로컬 키워드 매칭만 동작)
const GEMINI_KEY: string = import.meta.env.VITE_GEMINI_KEY ?? "";
const MODEL = "gemini-2.5-flash";

export interface Analysis {
  keywords: string[];
  category: string;
  comment: string;
}

const PROMPT = `당신은 한국 창업지원사업(K-Startup) 매칭 서비스의 분석 엔진입니다.
사용자가 적은 사업/아이템 설명을 읽고 — 링크(URL)가 포함되어 있으면 그 페이지 내용까지 참고해서 — 아래 JSON 하나만 출력하세요. 다른 텍스트는 절대 쓰지 마세요.

{"keywords": ["..."], "category": "...", "comment": "..."}

규칙:
- keywords: 지원사업 공고 검색에 쓸 한국어 핵심 키워드 5~10개. 업종/분야(예: 반도체, 푸드테크), 기술(예: AI, IoT), 제품 형태(예: 앱, 하드웨어), 창업 단계(예: 예비창업자, 청년), 지역이 있으면 지역명. 조사 없는 명사형으로.
- category: 사업의 정확한 분야 한두 단어. 소프트웨어와 하드웨어를 혼동하지 말 것 (예: "AI 반도체"는 소프트웨어 서비스가 아니라 반도체/하드웨어).
- comment: 매칭 캐릭터가 사용자에게 던질 한 문장. 친근한 존댓말, 이모지 금지, 60자 이내. 분야를 정확히 짚고 그 분야 특화 지원을 찾아보겠다는 톤.
  좋은 예: "AI 반도체라니 딥테크네요! 하드웨어·팹리스 특화 지원을 찾아볼게요."
  좋은 예: "상품 판매업은 일반 IT랑 접근이 달라요, 유통·커머스 쪽을 정확히 찾아보죠!"`;

interface GeminiPart {
  text?: string;
}

/** 선택한 공고 × 사용자 아이템 → 빨간 집중 포인트 한 줄. 실패 시 null */
export async function focusPoint(
  userText: string,
  noticeTitle: string,
  noticeBody: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!GEMINI_KEY) return null;
  const prompt = `한국 창업지원 공고와 지원자의 아이템입니다. 이 지원자가 이 공고에 지원할 때 가장 중요한 "집중 포인트"를 정확히 한 문장(45자 이내)으로 쓰세요. 자격요건 함정, 준비서류, 마감 시각, 평가 포인트 중 가장 결정적인 것 하나만. 문장만 출력하세요.

[지원자 아이템] ${userText.slice(0, 500)}
[공고 제목] ${noticeTitle}
[공고 내용] ${noticeBody.slice(0, 2500)}`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal,
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
    const line = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim()
      .replace(/^["'「]|["'」]$/g, "");
    return line || null;
  } catch {
    return null;
  }
}

export async function analyzeItem(text: string, signal?: AbortSignal): Promise<Analysis | null> {
  if (!GEMINI_KEY) return null;
  const hasUrl = /https?:\/\/\S+/i.test(text);

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: `${PROMPT}\n\n[사용자 입력]\n${text}` }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1500,
      // 반응속도 우선 — 추론 오버헤드 끔
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  // 링크가 있으면 Gemini가 직접 페이지를 읽게 한다 (url_context는 JSON 모드와 병행 불가라 프롬프트로 강제)
  if (hasUrl) {
    body.tools = [{ url_context: {} }];
  } else {
    (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify(body),
        signal,
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };
    const raw = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("");
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as Partial<Analysis>;
    if (!Array.isArray(parsed.keywords) || typeof parsed.comment !== "string") return null;
    return {
      keywords: parsed.keywords
        .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
        .map((k) => k.trim())
        .slice(0, 12),
      category: typeof parsed.category === "string" ? parsed.category : "",
      comment: parsed.comment.trim(),
    };
  } catch {
    return null;
  }
}
