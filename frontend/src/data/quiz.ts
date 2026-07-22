import type { QuizQuestion } from "../types";

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "창업을 결심하게 된다면, 가장 큰 이유는?",
    options: [
      { key: "A", label: "안정적인 내 매장·사업을 갖고 싶어서", type: "mainstreet" },
      { key: "B", label: "직접 만들어보고 싶은 기술·제품이 있어서", type: "tech" },
      { key: "C", label: "쌓아온 경력을 더 크게 펼치고 싶어서", type: "career" },
      { key: "D", label: "누구도 못 채운 시장의 빈틈이 보여서", type: "idea" },
    ],
  },
  {
    id: 2,
    text: "실패했을 때 나는 보통…",
    options: [
      { key: "A", label: "무엇보다 다시 도전할 용기를 되찾는 게 먼저다", type: "comeback" },
      { key: "B", label: "그동안 쌓은 노하우로 다시 계획을 세운다", type: "career" },
      { key: "C", label: "원인을 데이터로 분석해 다음 버전을 만든다", type: "tech" },
      { key: "D", label: "빠르게 다른 아이디어로 갈아탄다", type: "idea" },
    ],
  },
  {
    id: 3,
    text: "가장 끌리는 자금 조달 방식은?",
    options: [
      { key: "A", label: "크라우드펀딩으로 반응부터 확인", type: "idea" },
      { key: "B", label: "대출·정책자금으로 안정적으로 시작", type: "mainstreet" },
      { key: "C", label: "재도전 지원사업 등 회복 지원 프로그램", type: "comeback" },
      { key: "D", label: "기술력을 인정받는 투자 유치(VC 등)", type: "tech" },
    ],
  },
  {
    id: 4,
    text: "가장 즐거운 하루 일과는?",
    options: [
      { key: "A", label: "사람들과 미팅하며 사업을 넓히는 하루", type: "career" },
      { key: "B", label: "손님을 직접 맞이하고 매장을 운영하는 하루", type: "mainstreet" },
      { key: "C", label: "콘텐츠·기획안을 짜고 다듬는 하루", type: "idea" },
      { key: "D", label: "코드·설계를 붙잡고 문제를 푸는 하루", type: "tech" },
    ],
  },
  {
    id: 5,
    text: "나에게 '성공한 창업'이란?",
    options: [
      { key: "A", label: "단골이 꾸준히 찾아오는 가게를 만드는 것", type: "mainstreet" },
      { key: "B", label: "실패를 딛고 다시 일어섰다는 것 자체", type: "comeback" },
      { key: "C", label: "사람들이 사랑하는 브랜드를 만드는 것", type: "idea" },
      { key: "D", label: "내 전문성을 인정받는 사업가가 되는 것", type: "career" },
    ],
  },
  {
    id: 6,
    text: "리스크에 대한 나의 태도는?",
    options: [
      { key: "A", label: "불확실해도 될 것 같으면 밀어붙인다", type: "tech" },
      { key: "B", label: "경험으로 판단이 서면 움직인다", type: "career" },
      { key: "C", label: "확실한 수요를 확인한 뒤에 움직인다", type: "mainstreet" },
      { key: "D", label: "한 번 넘어져 봤기에 훨씬 신중해졌다", type: "comeback" },
    ],
  },
  {
    id: 7,
    text: "창업 준비 방식으로 가장 나다운 것은?",
    options: [
      { key: "A", label: "예전 실패 요인을 체크리스트로 정리한다", type: "comeback" },
      { key: "B", label: "프로토타입부터 만들어보며 검증한다", type: "tech" },
      { key: "C", label: "상권과 입지부터 꼼꼼히 조사한다", type: "mainstreet" },
      { key: "D", label: "여러 아이디어를 리스트업하고 좁혀간다", type: "idea" },
    ],
  },
  {
    id: 8,
    text: "5년 후 나의 모습으로 가장 바라는 것은?",
    options: [
      { key: "A", label: "많은 사람이 아는 브랜드의 창시자", type: "idea" },
      { key: "B", label: "경력을 살려 업계에 자리잡은 사업가", type: "career" },
      { key: "C", label: "동네에서 인정받는 오래된 가게 사장", type: "mainstreet" },
      { key: "D", label: "내 기술을 기반으로 한 회사의 대표", type: "tech" },
    ],
  },
];
