import type { QuizQuestion } from "../types";

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "창업을 결심하게 된 가장 큰 이유는?",
    options: [
      { key: "A", label: "직접 만들어보고 싶은 기술/제품이 있어서", type: "tech" },
      { key: "B", label: "누구도 못 채운 시장의 빈틈이 보여서", type: "idea" },
      { key: "C", label: "안정적인 내 매장·사업을 갖고 싶어서", type: "mainstreet" },
      { key: "D", label: "쌓아온 경력을 더 크게 펼치고 싶어서", type: "career" },
    ],
  },
  {
    id: 2,
    text: "새로운 아이디어가 떠오르면 가장 먼저 하는 행동은?",
    options: [
      { key: "A", label: "관련 기술이나 논문부터 찾아본다", type: "tech" },
      { key: "B", label: "주변 사람들에게 얘기해보고 반응을 살핀다", type: "idea" },
      { key: "C", label: "비슷한 걸 하는 가게나 매장을 가본다", type: "mainstreet" },
      { key: "D", label: "예전 실패에서 배운 걸 어떻게 적용할지 생각한다", type: "comeback" },
    ],
  },
  {
    id: 3,
    text: "실패했을 때 나는 보통…",
    options: [
      { key: "A", label: "원인을 데이터로 분석해서 다음 버전을 만든다", type: "tech" },
      { key: "B", label: "빠르게 다른 아이디어로 갈아탄다", type: "idea" },
      { key: "C", label: "무엇보다 다시 도전할 용기를 되찾는 게 먼저다", type: "comeback" },
      { key: "D", label: "경력에서 쌓은 노하우로 다시 계획을 세운다", type: "career" },
    ],
  },
  {
    id: 4,
    text: "가장 끌리는 자금 조달 방식은?",
    options: [
      { key: "A", label: "기술력을 인정받는 투자 유치(VC, TIPS 등)", type: "tech" },
      { key: "B", label: "크라우드펀딩으로 반응부터 확인", type: "idea" },
      { key: "C", label: "대출·정책자금으로 안정적으로 시작", type: "mainstreet" },
      { key: "D", label: "재도전 지원사업 등 회복 지원 프로그램", type: "comeback" },
    ],
  },
  {
    id: 5,
    text: "가장 즐거운 하루 일과는?",
    options: [
      { key: "A", label: "코드/설계를 붙잡고 문제를 푸는 하루", type: "tech" },
      { key: "B", label: "콘텐츠·기획안을 짜고 다듬는 하루", type: "idea" },
      { key: "C", label: "손님을 직접 맞이하고 매장을 운영하는 하루", type: "mainstreet" },
      { key: "D", label: "예전 동료·거래처와 미팅하며 사업을 넓히는 하루", type: "career" },
    ],
  },
  {
    id: 6,
    text: "팀을 꾸린다면 가장 먼저 채우고 싶은 자리는?",
    options: [
      { key: "A", label: "개발·엔지니어링 담당", type: "tech" },
      { key: "B", label: "브랜딩·콘텐츠 기획 담당", type: "idea" },
      { key: "C", label: "매장·현장 운영 담당", type: "mainstreet" },
      { key: "D", label: "이전 업계에서 데려올 신뢰할 파트너", type: "career" },
    ],
  },
  {
    id: 7,
    text: "나에게 '성공한 창업'이란?",
    options: [
      { key: "A", label: "기술로 시장의 판을 바꾸는 것", type: "tech" },
      { key: "B", label: "사람들이 사랑하는 브랜드를 만드는 것", type: "idea" },
      { key: "C", label: "단골이 꾸준히 찾아오는 가게를 만드는 것", type: "mainstreet" },
      { key: "D", label: "실패를 딛고 다시 일어섰다는 것 자체", type: "comeback" },
    ],
  },
  {
    id: 8,
    text: "정보를 얻을 때 가장 신뢰하는 경로는?",
    options: [
      { key: "A", label: "논문·기술 문서·오픈소스", type: "tech" },
      { key: "B", label: "트렌드 리포트와 SNS 반응", type: "idea" },
      { key: "C", label: "현장에서 직접 보고 들은 경험", type: "mainstreet" },
      { key: "D", label: "예전 직장·업계 네트워크", type: "career" },
    ],
  },
  {
    id: 9,
    text: "고객과의 관계에서 중요하게 생각하는 것은?",
    options: [
      { key: "A", label: "제품의 완성도와 성능으로 신뢰를 얻는 것", type: "tech" },
      { key: "B", label: "취향과 감성을 공유하는 팬을 만드는 것", type: "idea" },
      { key: "C", label: "얼굴 보고 관계를 쌓는 단골 장사", type: "mainstreet" },
      { key: "D", label: "예전부터 이어온 신뢰를 계속 지키는 것", type: "career" },
    ],
  },
  {
    id: 10,
    text: "리스크에 대한 나의 태도는?",
    options: [
      { key: "A", label: "불확실해도 기술이 되면 밀어붙인다", type: "tech" },
      { key: "B", label: "일단 작게 실험해보고 방향을 바꾼다", type: "idea" },
      { key: "C", label: "확실한 수요를 확인한 뒤에 움직인다", type: "mainstreet" },
      { key: "D", label: "한 번 넘어져 봤기 때문에 훨씬 신중해졌다", type: "comeback" },
    ],
  },
  {
    id: 11,
    text: "창업 준비 방식으로 가장 나다운 것은?",
    options: [
      { key: "A", label: "프로토타입부터 만들어보며 검증한다", type: "tech" },
      { key: "B", label: "여러 아이디어를 리스트업하고 좁혀간다", type: "idea" },
      { key: "C", label: "상권과 입지부터 꼼꼼히 조사한다", type: "mainstreet" },
      { key: "D", label: "예전 실패 원인을 체크리스트로 정리한다", type: "comeback" },
    ],
  },
  {
    id: 12,
    text: "5년 후 나의 모습으로 가장 바라는 것은?",
    options: [
      { key: "A", label: "내 기술을 기반으로 한 회사의 대표", type: "tech" },
      { key: "B", label: "많은 사람이 아는 브랜드의 창시자", type: "idea" },
      { key: "C", label: "동네에서 인정받는 오래된 가게 사장", type: "mainstreet" },
      { key: "D", label: "경력을 살려 업계에서 자리잡은 사업가", type: "career" },
    ],
  },
];
