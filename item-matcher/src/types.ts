/** 창업메이트 백엔드 /api/announcement/open 이 내려주는 slim 공고. */
export interface Announcement {
  pbanc_sn: number;
  biz_pbanc_nm: string;
  pbanc_ntrp_nm: string | null;
  sprv_inst: string | null;
  supt_biz_clsfc: string | null;
  supt_regin: string | null;
  aply_trgt: string | null;
  biz_enyy: string | null;
  biz_trgt_age: string | null;
  pbanc_rcpt_bgng_dt: string | null;
  pbanc_rcpt_end_dt: string | null;
  detl_pg_url: string | null;
  industries: string[];
}

export interface MatchResult {
  notice: Announcement;
  score: number;
  /** 사용자가 입력한 표현 기준으로 일치한 키워드들 */
  matched: string[];
}

export interface Profile {
  token: string;
  nickname: string;
  email: string;
}
