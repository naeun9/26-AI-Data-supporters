#!/usr/bin/env node
/**
 * 창업메이트 MCP 서버.
 *
 * Claude Desktop / Claude Code / 기타 MCP 클라이언트에서 창업 지원사업 공고를
 * 검색·조회할 수 있게 하는 stdio 서버. 데이터는 창업메이트 공개 API
 * (창업진흥원 K-Startup 공고 프록시)를 사용한다.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.CHANGUPMATE_API ?? "https://26-ai-data-supporters.vercel.app";

let cache = null;

async function getAnnouncements() {
  if (cache) return cache;
  const res = await fetch(`${API_BASE}/api/announcement/open`);
  if (!res.ok) throw new Error(`공고 API 오류: ${res.status}`);
  cache = (await res.json()).items;
  return cache;
}

/** item-matcher 프론트와 같은 단순 키워드 스코어링 */
function score(query, items, limit) {
  const tokens = (query.toLowerCase().match(/[가-힣a-z0-9]{2,}/g) ?? []).slice(0, 20);
  const out = [];
  for (const n of items) {
    const hay = [
      n.biz_pbanc_nm, n.supt_biz_clsfc, (n.industries ?? []).join(" "),
      n.pbanc_ntrp_nm, n.aply_trgt, n.supt_regin, n.biz_enyy,
    ].filter(Boolean).join(" ").toLowerCase();
    const matched = tokens.filter((t) => hay.includes(t));
    if (matched.length > 0) out.push({ ...n, _score: matched.length, _matched: matched });
  }
  out.sort((a, b) => b._score - a._score);
  return out.slice(0, limit);
}

const server = new McpServer({ name: "changupmate", version: "1.0.0" });

server.tool(
  "search_startup_programs",
  "사업 아이템/키워드로 현재 모집 중인 한국 창업 지원사업 공고를 검색한다. 예: 'AI 반도체 예비창업자'",
  { query: z.string().describe("사업 설명 또는 키워드"), limit: z.number().optional().describe("최대 결과 수 (기본 10)") },
  async ({ query, limit }) => {
    const items = await getAnnouncements();
    const hits = score(query, items, limit ?? 10).map((n) => ({
      pbanc_sn: n.pbanc_sn,
      title: n.biz_pbanc_nm,
      organization: n.pbanc_ntrp_nm,
      category: n.supt_biz_clsfc,
      region: n.supt_regin,
      target: n.aply_trgt,
      deadline: n.pbanc_rcpt_end_dt,
      url: n.detl_pg_url,
      matched_keywords: n._matched,
    }));
    return { content: [{ type: "text", text: JSON.stringify({ count: hits.length, results: hits }, null, 2) }] };
  },
);

server.tool(
  "get_program_detail",
  "공고 번호(pbanc_sn)로 지원사업 상세(본문, 신청방법, 담당자 등)를 조회한다.",
  { pbanc_sn: z.number().describe("search_startup_programs가 돌려준 공고 번호") },
  async ({ pbanc_sn }) => {
    const res = await fetch(`${API_BASE}/api/announcement/${pbanc_sn}`);
    if (!res.ok) throw new Error(`상세 조회 실패: ${res.status}`);
    return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
  },
);

server.tool(
  "list_open_programs",
  "현재 모집 중인 전체 지원사업 공고 목록을 마감 임박순으로 조회한다.",
  { limit: z.number().optional().describe("최대 결과 수 (기본 20)") },
  async ({ limit }) => {
    const items = [...(await getAnnouncements())]
      .sort((a, b) => ((a.pbanc_rcpt_end_dt ?? "9999") < (b.pbanc_rcpt_end_dt ?? "9999") ? -1 : 1))
      .slice(0, limit ?? 20)
      .map((n) => ({
        pbanc_sn: n.pbanc_sn,
        title: n.biz_pbanc_nm,
        organization: n.pbanc_ntrp_nm,
        deadline: n.pbanc_rcpt_end_dt,
        url: n.detl_pg_url,
      }));
    return { content: [{ type: "text", text: JSON.stringify({ count: items.length, results: items }, null, 2) }] };
  },
);

await server.connect(new StdioServerTransport());
