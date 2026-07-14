# 26-AI-Data-supporters

# 로컬 실행 가이드

 두 개의 터미널 창을 열어 백엔드와 프론트엔드 서버를 각각 실행해 주세요.

---

## 1. 백엔드 (API) 실행 방법

새 터미널을 열고 프로젝트 최상위 폴더에서 시작합니다.

1. 폴더 이동 및 가상환경 생성
```bash
cd backend
python -m venv .venv
```

2. 가상환경 활성화 (Windows 기준)

```bash
.venv\Scripts\activate
```
(Mac/Linux의 경우: source .venv/bin/activate)

3. 패키지 설치
```bash
pip install -r requirements.txt
```

4. 환경 변수 설정
backend 폴더 내에 .env 파일을 생성하고 공공데이터 API 키를 입력합니다.

주의: URL 인코딩이 되지 않은 평문(Decoding) 키를 사용해야 합니다.
```bash
KISED_SERVICE_KEY=여기에_인증키_입력

# AI 챗봇용 Claude API 키 (선택 — 없으면 챗봇이 키워드 매칭으로만 동작)
ANTHROPIC_API_KEY=

# 로그인 JWT 서명 키 (아무 무작위 긴 문자열)
JWT_SECRET=change-me-to-a-random-string
```

5. 서버 실행
```Bash
uvicorn app.main:app --reload
```
API 서버 주소: http://127.0.0.1:8000

API 명세서 (Swagger): http://127.0.0.1:8000/docs

## 2. 프론트엔드 실행 방법
새로운 터미널 창을 열고 프로젝트 최상위 폴더에서 시작합니다.

1. 폴더 이동

```Bash
cd frontend
```

2. 패키지 설치
```Bash
npm install
```

3. 통계 데이터 생성
(최초 실행 시 또는 CSV 원본 데이터가 변경되었을 때 1회 실행합니다.)
```Bash
npm run build:stats
```

4. 개발 서버 실행
```Bash
npm run dev
```
프론트엔드 웹 주소: http://localhost:5173

## 최종 접속
두 서버가 모두 실행되었다면, 웹 브라우저를 열고 http://localhost:5173으로 이용

## 백엔드 추가 기능 (로그인 + AI 챗봇)

### 로그인 시스템
- `POST /api/auth/signup` — 회원가입 `{email, password, nickname}` → `{token, user}`
- `POST /api/auth/login` — 로그인 `{email, password}` → `{token, user}`
- `GET /api/auth/me` — 내 정보 (헤더 `Authorization: Bearer <token>`)
- 유저는 `backend/users.db`(SQLite)에 저장, 비밀번호는 PBKDF2 해시, 토큰은 JWT(7일 유효)
- 프론트 로그인/회원가입 페이지의 **이메일 폼**이 이 API에 연결됨 (소셜 버튼은 아직 목업)

### AI 챗봇
- `POST /api/chat` — 대화 이력을 보내면 `{reply, notice_sns, ...}` 반환
- `ANTHROPIC_API_KEY`가 설정돼 있으면 Claude가 모집중 공고 중에서 조건에 맞는 것을 골라
  자연어로 상담해주고, 키가 없으면 기존 키워드 매칭 방식으로 자동 폴백
- KISED 공고 캐시를 그대로 재사용하므로 공고 API 쪽 코드는 변경 없음
