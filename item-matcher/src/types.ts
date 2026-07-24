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

/** /api/announcement/{sn} 상세 — slim + 본문/신청방법/링크/담당자 */
export interface AnnouncementDetail extends Omit<Announcement, "industries"> {
  pbanc_ctnt: string | null;
  aply_excl_trgt_ctnt: string | null;
  aply_mthd_vst_rcpt_istc: string | null;
  aply_mthd_pssr_rcpt_istc: string | null;
  aply_mthd_fax_rcpt_istc: string | null;
  aply_mthd_eml_rcpt_istc: string | null;
  aply_mthd_onli_rcpt_istc: string | null;
  aply_mthd_etc_istc: string | null;
  biz_gdnc_url: string | null;
  biz_aply_url: string | null;
  prch_cnpl_no: string | null;
  biz_prch_dprt_nm: string | null;
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
