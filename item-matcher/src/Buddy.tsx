/** 미니멀 라인 드로잉의 사람 캐릭터 (노션 일러스트와는 다른 오리지널 디자인).
 *  mood에 따라 눈썹/눈/입/소품이 부드럽게 움직인다 (CSS transition + SVG).
 */
export type Mood = "idle" | "thinking" | "eureka" | "puzzled";

export function Buddy({ mood }: { mood: Mood }) {
  return (
    <div className={`buddy mood-${mood}`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        {/* 깨달음 스파크 (eureka에서만) */}
        <g className="spark" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round">
          <path d="M60 16 l3 -5" />
          <path d="M66 22 l5 -3" />
          <path d="M65 30 l6 1" />
        </g>

        {/* 얼굴 */}
        <circle cx="38" cy="41" r="29" fill="#fff" stroke="#d4d4d8" strokeWidth="2" />

        {/* 앞머리 — 물결 단발 (채움) */}
        <path
          d="M10.5 38 A 29 29 0 0 1 65.5 38
             Q 61 30 52.5 31
             Q 47 24 37 27.5
             Q 27 24 21 31
             Q 14 31 10.5 38 Z"
          fill="#27272a"
        />

        {/* 연필 (thinking에서 귀 옆에 등장) */}
        <g className="pencil">
          <rect x="62" y="36" width="5" height="15" rx="1.4" fill="#ef4444" transform="rotate(24 64 43)" />
          <path d="M66 52.5 l2.4 4.3 l-4.8 0.4 Z" fill="#fbbf24" transform="rotate(24 66 54)" />
        </g>

        {/* 눈썹 — 가는 곡선 */}
        <path className="brow brow-l" d="M25.5 37 q4 -2.6 8 -1" stroke="#27272a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className="brow brow-r" d="M43 36 q4 -1.8 8 0.4" stroke="#27272a" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* 눈 (blink는 안쪽 g, 시선 이동은 바깥 g) */}
        <g className="eyes">
          <g className="blink">
            <circle cx="30" cy="43.5" r="2.2" fill="#18181b" />
            <circle cx="47" cy="43.5" r="2.2" fill="#18181b" />
          </g>
        </g>

        {/* 작은 코 — 짧은 곡선 하나 */}
        <path d="M39 47 q1.4 3 -0.6 4.6" stroke="#27272a" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* 볼터치 — eureka에서만 */}
        <g className="cheeks" fill="#fda4af" opacity="0">
          <circle cx="24" cy="52" r="2.8" />
          <circle cx="52.5" cy="52" r="2.8" />
        </g>

        {/* 입 — mood별 크로스페이드 */}
        <path className="mouth m-idle" d="M34 58 h8" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <circle className="mouth m-o" cx="38" cy="58" r="2.7" stroke="#18181b" strokeWidth="2" fill="none" />
        <path className="mouth m-smile" d="M31.5 56.5 q6.5 6.5 13 0" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path className="mouth m-flat" d="M32 58.5 q3 -2.5 6 0 q3 2.5 6 0" stroke="#18181b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/** 분야 사전 — 원문 전체를 보고 우선순위가 높은(구체적인) 분야부터 잡는다.
 *  Gemini 분석이 실패했을 때의 폴백. */
interface Category {
  re: RegExp;
  pri: number;
  line: string;
}

const CATEGORIES: Category[] = [
  // ── 하드웨어/딥테크 (구체적 — 최우선) ──
  { re: /반도체|팹리스|파운드리|칩|\b(npu|fpga)\b/i, pri: 10, line: "반도체라니 딥테크네요! 하드웨어·팹리스 특화 지원을 찾아볼게요." },
  { re: /배터리|이차전지|전지/, pri: 10, line: "배터리 분야군요! 소재·에너지 특화 지원을 찾아볼게요." },
  { re: /로봇|로보틱스|드론/, pri: 9, line: "로봇·드론 기술이네요! 딥테크 지원사업을 찾아볼게요." },
  { re: /하드웨어|\biot\b|임베디드|센서|장비|기계/i, pri: 9, line: "하드웨어군요! 시제품 제작·양산 지원 쪽을 눈여겨볼게요." },
  { re: /우주|항공|위성/, pri: 10, line: "우주·항공이라니 스케일이 크네요! 딥테크 특화 지원을 찾아볼게요." },
  { re: /소재|신소재|나노/, pri: 9, line: "소재 기술이군요! R&D 중심 지원사업을 찾아볼게요." },
  { re: /전기차|모빌리티|자율주행|자동차/, pri: 9, line: "모빌리티 분야네요! 미래차 특화 프로그램을 찾아볼게요." },
  { re: /에너지|태양광|풍력|수소/, pri: 9, line: "에너지 분야군요! 그린에너지 특화 지원을 살펴볼게요." },
  { re: /제조|공장|양산|생산/, pri: 8, line: "제조업이군요! 스마트공장·시제품 지원 쪽을 눈여겨볼게요." },
  // ── 바이오/의료 ──
  { re: /제약|신약|바이오/, pri: 9, line: "바이오 분야군요! R&D 규모가 큰 특화 지원을 찾아볼게요." },
  { re: /의료|헬스케어|병원|진단|건강관리/, pri: 8, line: "헬스케어군요. 규제가 많은 분야라 전문 지원사업을 골라볼게요." },
  // ── 커머스/유통/판매 ──
  { re: /유통|도소매|물류|배송|풀필먼트/, pri: 8, line: "유통·물류군요! 커머스 인프라 쪽 지원을 찾아볼게요." },
  { re: /이커머스|커머스|쇼핑몰|스마트스토어|온라인.?판매|상품.?판매|판매업|리테일|셀러/, pri: 8, line: "상품 판매업은 일반 IT랑 접근이 달라요! 유통·커머스 쪽을 정확히 찾아보죠." },
  { re: /수공예|핸드메이드|공방/, pri: 8, line: "핸드메이드군요! 소상공인·공예 특화 지원도 있어요." },
  // ── 음식/농업 ──
  { re: /푸드테크|식품|음식|외식|요식|카페|레스토랑|베이커리|주류/, pri: 8, line: "푸드 분야네요! 식품·외식 특화 프로그램을 뒤져볼게요." },
  { re: /농업|스마트팜|농식품|축산|수산|어업/, pri: 8, line: "애그테크네요! 농식품 특화 지원사업을 찾아볼게요." },
  // ── 서비스업 ──
  { re: /대행사|에이전시|마케팅|광고|브랜딩|홍보/, pri: 8, line: "대행·마케팅업이군요! 서비스업 맞춤 지원을 찾아볼게요." },
  { re: /컨설팅|법률|리걸|세무|회계|노무/, pri: 8, line: "전문 서비스업이네요! 지식서비스 특화 지원을 찾아볼게요." },
  { re: /부동산|프롭테크|공간|인테리어|건설|건축/, pri: 8, line: "공간·부동산 분야군요! 프롭테크 쪽 지원을 살펴볼게요." },
  { re: /뷰티|화장품|미용|네일|헤어/, pri: 8, line: "뷰티 분야네요! K-뷰티 특화 지원이 꽤 있어요." },
  { re: /패션|의류|잡화|악세서리/, pri: 8, line: "패션이군요! 디자인·패션 특화 프로그램을 찾아볼게요." },
  { re: /여행|관광|숙박|호텔|투어/, pri: 8, line: "관광 분야네요! 지역·관광 특화 공고를 확인해볼게요." },
  { re: /스포츠|피트니스|헬스장|운동/, pri: 8, line: "스포츠 분야군요! 스포츠산업 특화 지원을 찾아볼게요." },
  { re: /반려동물|펫/, pri: 8, line: "펫 산업이군요! 요즘 뜨는 분야라 지원도 늘고 있어요." },
  { re: /시니어|실버|요양|돌봄/, pri: 8, line: "시니어 케어군요! 고령친화산업 지원을 찾아볼게요." },
  { re: /육아|키즈|유아|보육/, pri: 8, line: "키즈 분야네요! 육아·교육 특화 지원을 살펴볼게요." },
  // ── 콘텐츠/교육 ──
  { re: /게임|메타버스|\b(ar|vr|xr)\b/i, pri: 8, line: "게임·실감콘텐츠군요! 콘텐츠진흥 쪽 지원이 따로 있어요." },
  { re: /콘텐츠|미디어|영상|웹툰|음악|엔터/, pri: 7, line: "콘텐츠 분야군요! 문화·콘텐츠 특화 지원이 꽤 있어요." },
  { re: /교육|에듀테크|에듀|이러닝|학원|강의/, pri: 7, line: "에듀테크네요! 교육 분야 지원사업을 모아볼게요." },
  // ── 금융/보안/데이터 ──
  { re: /핀테크|금융|보험|인슈어테크|결제|송금/, pri: 8, line: "핀테크군요! 금융 분야는 전용 프로그램이 따로 있어요." },
  { re: /블록체인|웹3|코인|\bnft\b/i, pri: 8, line: "웹3 분야군요! 블록체인 특화 지원을 찾아볼게요." },
  { re: /보안|시큐리티|해킹/, pri: 8, line: "보안 분야네요! 정보보호 특화 지원을 찾아볼게요." },
  { re: /데이터|빅데이터|클라우드/, pri: 6, line: "데이터 기술이군요! DX 특화 지원사업을 찾아볼게요." },
  // ── 환경/글로벌/단계 ──
  { re: /친환경|환경|그린|에코|기후|재활용|업사이클/, pri: 7, line: "그린 창업이네요! 환경·ESG 특화 공고를 살펴볼게요." },
  { re: /글로벌|해외|수출|국제/, pri: 6, line: "해외 진출까지 보시는군요! 글로벌 특화 프로그램을 찾아볼게요." },
  // ── 일반 IT/SW (범용 — 하드웨어 뒤 순위) ──
  { re: /\b(saas|b2b)\b|구독|솔루션/i, pri: 6, line: "SaaS 비즈니스군요! SW 스타트업 지원사업을 찾아볼게요." },
  { re: /앱|어플|모바일/, pri: 5, line: "앱 서비스군요! 모바일·플랫폼 쪽 지원을 찾아볼게요." },
  { re: /플랫폼|중개|매칭.?서비스/, pri: 5, line: "플랫폼 비즈니스네요! 온라인 서비스 지원을 찾아볼게요." },
  { re: /\bai\b|인공지능|머신러닝|딥러닝|\bllm\b|생성형/i, pri: 4, line: "AI 서비스군요.. 이런 쪽으로 특화된 사업지원을 찾아볼게요!" },
  { re: /\bit\b|소프트웨어|개발|웹/i, pri: 3, line: "IT 분야군요! SW 창업 지원사업을 찾아볼게요." },
  // ── 대상/단계 (분야가 안 잡힐 때) ──
  { re: /여성/, pri: 2, line: "여성 창업 전용 프로그램부터 챙겨볼게요!" },
  { re: /청년|대학생/, pri: 2, line: "청년이시군요! 청년 전용 지원사업이 정말 많아요." },
  { re: /재창업|재도전/, pri: 2, line: "재도전이시군요, 응원해요! 재도전 특화 프로그램이 있어요." },
  { re: /예비창업/, pri: 1, line: "예비창업자시군요! 예비 단계 전용 공고부터 볼게요." },
  { re: /소상공인|자영업/, pri: 2, line: "소상공인이시군요! 소진공 쪽 지원사업도 같이 볼게요." },
];

/** 원문에서 가장 구체적인 분야를 골라 멘트를 만든다 (Gemini 실패 시 폴백).
 *  URL은 분야 판별에서 제외 — 링크 문자열이 엉뚱한 분야로 오인되는 것 방지. */
export function verdictLine(rawText: string, count: number): string {
  const text = rawText.replace(/https?:\/\/\S+/gi, " ").toLowerCase();

  // 링크만 있고 설명이 없으면 — 아는 척하지 않고 솔직하게
  if (!text.trim()) {
    return "링크만으로는 아직 감이 안 와요. 어떤 사업인지 한 줄만 덧붙여 주시면 정확하게 찾아드릴게요!";
  }
  let best: Category | null = null;
  for (const c of CATEGORIES) {
    if (c.re.test(text) && (!best || c.pri > best.pri)) best = c;
  }
  const base = best?.line ?? null;
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
