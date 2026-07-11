import type { TypeKey } from "../types";

/** Display-only label lookup so small UI chips don't need a network round trip
 * just to show a type name the user already knows (full copy still comes from
 * GET /api/types on the Result page). */
export const TYPE_NAMES: Record<TypeKey, string> = {
  tech: "기술혁신형",
  idea: "아이디어형",
  mainstreet: "생계형자영업형",
  career: "경력전환형",
  comeback: "재도전형",
};
