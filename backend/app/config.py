import os
from dotenv import load_dotenv

load_dotenv()

# .env 의 KISED_SERVICE_KEY 사용.
# ※ 반드시 '일반 인증키(Decoding 키)'를 넣을 것. 평문(%인코딩 없음)이어야 함.
#   httpx 가 params 로 넘길 때 자동 URL 인코딩하므로, 이미 인코딩된
#   Encoding 키를 넣으면 이중 인코딩되어 에러코드 30(SERVICE_KEY_IS_NOT_REGISTERED) 발생함.
KISED_SERVICE_KEY: str = os.getenv("KISED_SERVICE_KEY", "")

# AI 챗봇용 Claude API 키 (없으면 챗봇이 키워드 매칭 폴백으로 동작)
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

# JWT 서명 키 — 배포 시 반드시 .env에서 무작위 문자열로 교체할 것
JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-me")

# 구글 OAuth 클라이언트 ID (Google Cloud Console → 사용자 인증 정보에서 발급)
# 비어 있으면 프론트의 구글 로그인 버튼이 "설정 필요" 안내를 띄운다.
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

# 관리자 페이지(/admin) 접근 비밀번호 — 배포 시 ADMIN_PASSWORD 환경변수로 교체 권장
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "cjm9887@")

BASE_URL = "https://apis.data.go.kr/B552735"

# 서비스(도메인)별 엔드포인트 3종
SERVICES = {
    "kstartup": f"{BASE_URL}/kisedKstartupService01",  # 사업소개/공고/콘텐츠/통계
    "cert": f"{BASE_URL}/kisedCertService",            # 창업기업확인서 발급기업
    "edu": f"{BASE_URL}/kisedEduService",              # 창업에듀(교육과정)
}

# 상세기능(오퍼레이션) 7개 → (서비스키, 경로)
# 경로는 설계서 Call Back URL(외부노출) 기준 = apis.data.go.kr 버전('01' 접미사).
OPERATIONS = {
    # K-Startup
    "business":     ("kstartup", "getBusinessInformation01"),      # 통합공고 사업정보
    "announcement": ("kstartup", "getAnnouncementInformation01"),  # 지원사업 공고
    "content":      ("kstartup", "getContentInformation01"),       # 창업 콘텐츠
    "statistics":   ("kstartup", "getStatisticalInformation01"),   # 창업 통계보고서
    # 창업기업확인서 (경로는 설계서 목록 기준, '01' 없음)
    "corporate":    ("cert", "getCorporateInformation"),           # 확인서 발급 기업
    "product":      ("cert", "getProductInformation"),             # 발급 기업 제품
    # 창업에듀
    "education":    ("edu", "getEducationInformation"),            # 창업교육 과정
}

# 공통 파라미터 (설계서 확정: 신식 인프라 규격)
PAGE_PARAM = "page"          # 페이지 번호
SIZE_PARAM = "perPage"       # 한 페이지 결과 수
FORMAT_PARAM = "returnType"  # 반환 타입
FORMAT_VALUE = "json"        # json / xml (설계서 기본값은 JSON)

# op별 허용 조회 필터 (요청 메시지 명세 기준)
# 값이 있는 것만 params 로 전달됨. 여기 없는 필터는 무시.
FILTERS = {
    "business": ["biz_category_cd", "supt_biz_titl_nm", "biz_yr"],
    "announcement": [
        "intg_pbanc_yn", "intg_pbanc_biz_nm", "biz_pbanc_nm", "supt_biz_clsfc",
        "aply_trgt_ctnt", "supt_regin", "pbanc_rcpt_bgng_dt", "pbanc_rcpt_end_dt",
        "aply_trgt", "biz_enyy", "biz_trgt_age", "prfn_matr", "rcrt_prgs_yn",
    ],
    "content": ["clss_cd", "titl_nm"],
    "statistics": ["titl_nm"],
    "corporate": [],   # 상세 요청 필터는 설계서에 미기재 → 가이드/미리보기로 확인
    "product": [],
    "education": [],   # 코드표만 제공 (LCTR_LCLSS/MCLSS/SCLSS_CD 계열)
}

# 코드표 (필터·표시용 참고)
CODES = {
    # 사업 구분 코드 (business.biz_category_cd)
    "biz_category_cd": {
        "cmrczn_tab1": "사업화", "cmrczn_tab2": "창업교육",
        "cmrczn_tab3": "시설,공간,보육", "cmrczn_tab4": "멘토링,컨설팅",
        "cmrczn_tab5": "행사,네트워크", "cmrczn_tab6": "기술개발 R&D",
        "cmrczn_tab7": "융자", "cmrczn_tab8": "인력", "cmrczn_tab9": "글로벌",
    },
    # 콘텐츠 구분 코드 (content.clss_cd)
    "clss_cd": {
        "notice_matr": "정책 및 규제정보(공지사항)",
        "fnd_scs_case": "창업우수사례",
        "kstartup_isse_trd": "생태계 이슈, 동향",
    },
}
