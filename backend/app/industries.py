"""공고 제목+내용 키워드 기반 업종 태깅 사전.

KISED 원본 응답엔 업종 필드가 없어서(K-Startup/기업마당도 마찬가지) 우리가 직접
biz_pbanc_nm(제목) + pbanc_ctnt(내용) 텍스트에서 키워드를 찾아 부가로 태깅한다.
대시보드가 쓰는 18개 표준산업분류 전체가 아니라, 창업 지원사업 공고에 실제로
자주 등장하는 8개 업종만 추린 것 — 나머지는 COMMON_INDUSTRY(전 업종 공통)로 묶인다.

실측 오매칭 2건을 확인해서 가볍게 손봤음(완벽 제거는 목표 아님 — 나머지는 필터 옆
투명성 안내로 커버):
  - "제조" 키워드가 "경제조직"(사회연대'경제조직') 안에 우연히 포함돼 매칭된 사례 → 이건
    한글 단어 특성상 완전히 막기 어려워 그대로 둠(허용 오차로 판단).
  - "생산"/"카페"처럼 문맥 없이 흔해서 오매칭 유발 소지가 큰 키워드는 제거.
  - "IT"가 "UNIVERSITY" 안에서 부분일치로 잡힌 사례 → 영어 약어 키워드(IT/AI/SW/ICT/R&D)만
    단어경계(\\b) 매칭으로 바꿔서 이런 부분일치를 막음. 한글 키워드는 띄어쓰기 없는 복합어가
    흔해서(예: "제조업") 단어경계를 걸면 오히려 정상 매칭까지 다 놓치므로 그대로 부분일치 유지.
"""
import re

COMMON_INDUSTRY = "전 업종 공통"

INDUSTRY_KEYWORDS: dict[str, list[str]] = {
    "정보통신·IT": [
        "IT", "소프트웨어", "SW", "앱", "플랫폼", "AI", "인공지능", "데이터", "ICT",
        "빅데이터", "클라우드", "블록체인", "핀테크", "메타버스", "디지털전환",
    ],
    "제조": [
        "제조", "공장", "스마트공장", "부품", "소재", "장비", "설비", "뿌리산업", "양산",
    ],
    "도소매·유통": [
        "도소매", "유통", "쇼핑몰", "이커머스", "온라인판매", "리테일", "물류", "입점",
    ],
    "숙박·음식점": [
        "외식", "음식", "식품", "요식", "베이커리", "푸드", "레스토랑", "숙박", "호텔", "관광숙박",
    ],
    "교육서비스": [
        "교육", "에듀테크", "이러닝", "학습", "튜터링", "교육콘텐츠", "교육과정",
    ],
    "전문·과학·기술서비스": [
        "전문서비스", "과학기술", "연구개발", "R&D", "기술개발", "특허", "지식재산", "엔지니어링", "컨설팅",
    ],
    "예술·스포츠·여가": [
        "콘텐츠", "문화", "예술", "공연", "게임", "웹툰", "스포츠", "레저", "여가", "엔터테인먼트",
    ],
    "보건·복지": [
        "의료", "헬스케어", "바이오", "제약", "복지", "돌봄", "메디컬", "헬스",
    ],
}


def _compile(keyword: str) -> re.Pattern:
    # 영어 약어(IT/AI/SW/ICT/R&D)는 UNIVERSITY, CREDIT처럼 다른 단어 안에 우연히
    # 끼어드는 부분일치를 막기 위해 단어경계로. 한글은 복합어가 흔해 부분일치 그대로 둠.
    if keyword.isascii():
        return re.compile(rf"\b{re.escape(keyword)}\b", re.IGNORECASE)
    return re.compile(re.escape(keyword))


_COMPILED_KEYWORDS: dict[str, list[re.Pattern]] = {
    name: [_compile(kw) for kw in kws] for name, kws in INDUSTRY_KEYWORDS.items()
}


def tag_industries(title: str, content: str) -> list[str]:
    """제목+내용에서 업종 키워드를 찾아 태깅. 여러 업종에 동시에 걸릴 수 있고,
    아무 것도 안 걸리면 COMMON_INDUSTRY 하나로 태깅(숨기지 않음 — 대부분이 여기 해당할 것으로 예상)."""
    haystack = f"{title} {content}"
    matched = [name for name, patterns in _COMPILED_KEYWORDS.items() if any(p.search(haystack) for p in patterns)]
    return matched if matched else [COMMON_INDUSTRY]
