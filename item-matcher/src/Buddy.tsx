/** 노션 일러스트 무드의 라인 드로잉 캐릭터.
 *  mood에 따라 눈썹/눈/입이 부드럽게 움직인다 (CSS transition + SVG).
 */
export type Mood = "idle" | "thinking" | "eureka" | "puzzled";

export function Buddy({ mood }: { mood: Mood }) {
  return (
    <div className={`buddy mood-${mood}`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        {/* 얼굴 */}
        <circle cx="38" cy="38" r="31" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />

        {/* 깨달음 스파크 (eureka에서만) */}
        <g className="spark" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round">
          <path d="M58 12 l3 -5" />
          <path d="M64 18 l5 -3" />
          <path d="M63 26 l6 1" />
        </g>

        {/* 연필 (thinking에서 귀에 꽂힘) */}
        <g className="pencil">
          <rect x="60" y="26" width="5" height="16" rx="1.4" fill="#ef4444" transform="rotate(28 62 34)" />
          <path d="M66.5 44.5 l2.6 4.6 l-5.1 0.5 Z" fill="#fbbf24" transform="rotate(28 66 46)" />
        </g>

        {/* 눈썹 */}
        <path
          className="brow brow-l"
          d="M23 29 q5 -6 11 -2"
          stroke="#18181b"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="brow brow-r"
          d="M43 27 q5 -4 10 0"
          stroke="#18181b"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />

        {/* 눈 (blink는 안쪽 g에서, 시선 이동은 바깥 g에서) */}
        <g className="eyes">
          <g className="blink">
            <circle cx="29" cy="36" r="2.1" fill="#18181b" />
            <circle cx="48" cy="35" r="2.1" fill="#18181b" />
          </g>
        </g>

        {/* 노션풍 꺾인 코 */}
        <path
          d="M39 34 l-5 13 h6"
          stroke="#18181b"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 입 — mood별로 크로스페이드 */}
        <path className="mouth m-idle" d="M34 55 h8" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <circle className="mouth m-o" cx="38.5" cy="55" r="2.8" stroke="#18181b" strokeWidth="2" fill="none" />
        <path className="mouth m-smile" d="M32 53.5 q6 6.5 13 -0.5" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path
          className="mouth m-flat"
          d="M33 55.5 q3 -2.5 6 0 q3 2.5 6 0"
          stroke="#18181b"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/** 입력 키워드에서 분야를 읽고 캐릭터가 던질 멘트를 고른다. */
const CATEGORY_LINES: Array<[RegExp, string]> = [
  [/^(ai|인공지능|머신러닝|딥러닝)$/, "AI 서비스군요.. 이런 쪽으로 특화된 사업지원을 찾아볼게요!"],
  [/^(커머스|이커머스|쇼핑몰|판매|유통|리테일)$/, "상품 판매업은 일반 IT보다 다르게 접근해야 돼요! 정확히 찾아보죠."],
  [/^(식품|푸드|푸드테크|외식|음식|카페|요식)$/, "푸드 분야네요! 식품·외식 특화 프로그램을 뒤져볼게요."],
  [/^(의료|헬스케어|바이오|병원|건강)$/, "헬스케어군요. 규제가 많은 분야라 전문 지원사업을 골라볼게요."],
  [/^(환경|친환경|그린|에코|기후)$/, "그린 창업이네요! 환경·ESG 특화 공고를 살펴볼게요."],
  [/^(콘텐츠|게임|미디어|영상|웹툰)$/, "콘텐츠 분야군요! 문화·콘텐츠 특화 지원이 꽤 있어요."],
  [/^(교육|에듀|에듀테크|이러닝)$/, "에듀테크네요! 교육 분야 지원사업을 모아볼게요."],
  [/^(핀테크|금융)$/, "핀테크군요! 금융 분야는 전용 프로그램이 따로 있어요."],
  [/^(농업|스마트팜|농식품|농촌)$/, "애그테크네요! 농식품 특화 지원사업을 찾아볼게요."],
  [/^(글로벌|해외|수출)$/, "해외 진출까지 보시는군요! 글로벌 특화 프로그램을 찾아볼게요."],
  [/^(제조|제조업|하드웨어|공장)$/, "제조업이군요! 시제품·양산 지원 쪽을 눈여겨볼게요."],
  [/^(관광|여행|숙박)$/, "관광 분야네요! 지역·관광 특화 공고를 확인해볼게요."],
  [/^(반려동물|펫)$/, "펫 산업이군요! 요즘 뜨는 분야라 지원도 늘고 있어요."],
  [/^(로봇|로보틱스|드론|자동화)$/, "로봇·하드웨어 기술이네요! 딥테크 지원사업을 찾아볼게요."],
  [/^(여성)$/, "여성 창업 전용 프로그램부터 챙겨볼게요!"],
  [/^(청년|대학생)$/, "청년이시군요! 청년 전용 지원사업이 정말 많아요."],
  [/^(예비창업자|예비창업|예비)$/, "예비창업자시군요! 예비 단계 전용 공고부터 볼게요."],
  [/^(재창업|재도전)$/, "재도전이시군요, 응원해요! 재도전 특화 프로그램이 있어요."],
];

export function verdictLine(keywords: string[], count: number): string {
  let base: string | null = null;
  for (const kw of keywords) {
    const hit = CATEGORY_LINES.find(([re]) => re.test(kw));
    if (hit) {
      base = hit[1];
      break;
    }
  }
  if (count === 0) {
    return base
      ? `${base} ...그런데 지금 모집 중인 건 안 보이네요. 조금 다르게 표현해 볼까요?`
      : "음… 조금 더 구체적으로 적어주시면 딱 맞는 공고를 찾아드릴게요!";
  }
  const tail = `지금 모집 중인 ${count}건을 찾았어요!`;
  return base ? `${base} ${tail}` : `오, 좋은데요? ${tail} 마감 임박한 것부터 확인해보세요.`;
}

export const IDLE_LINE = "안녕하세요! 어떤 사업을 준비 중이세요? 편하게 적어주시면 제가 공고를 뒤져볼게요.";

export const THINKING_LINES = [
  "흠, 어떤 분야인지 볼게요…",
  "궁리 중이에요…",
  "공고 더미를 뒤지는 중…",
  "이거다 싶은 게 있나 보는 중…",
];
