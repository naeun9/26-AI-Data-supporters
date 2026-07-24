# 창업메이트 MCP 서버

창업 지원사업 공고 검색·매칭을 **당신의 AI 에이전트, 터미널, 워크플로우에 연결**하는 MCP(Model Context Protocol) 서버입니다.

제공 도구:

| 도구 | 설명 |
|---|---|
| `search_startup_programs` | 사업 아이템/키워드로 모집 중 공고 매칭 검색 |
| `get_program_detail` | 공고 번호로 상세(본문·신청방법·담당자) 조회 |
| `list_open_programs` | 모집 중 전체 공고를 마감 임박순으로 나열 |

## 설치

```bash
git clone https://github.com/naeun9/26-AI-Data-supporters.git
cd 26-AI-Data-supporters/mcp-server
npm install
```

## Claude Code (터미널)

```bash
claude mcp add changupmate -- node /절대경로/26-AI-Data-supporters/mcp-server/index.js
```

## Claude Desktop

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "changupmate": {
      "command": "node",
      "args": ["/절대경로/26-AI-Data-supporters/mcp-server/index.js"]
    }
  }
}
```

## 사용 예

연결 후 에이전트에게 이렇게 물어보세요:

> "AI 헬스케어 예비창업자가 지원할 수 있는 공고 찾아서 마감 임박한 순으로 정리해줘"

## 환경변수

- `CHANGUPMATE_API` — API 베이스 URL (기본: `https://26-ai-data-supporters.vercel.app`)
