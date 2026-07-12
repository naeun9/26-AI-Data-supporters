export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** "www.xxx.kr", "forms.gle/abc" 처럼 프로토콜 없이 오는 도메인 형태(공백·한글 없이 도메인+선택적 경로만). */
const BARE_DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/\S*)?$/i;

/** KISED 응답의 링크 필드가 프로토콜 없이 오는 경우가 많아(온라인 신청 URL, 강의 상세 URL 등)
 * 문장형 안내문은 걸러내고 실제 도메인 형태만 https://를 붙여 절대경로로 만든다. */
export function toAbsoluteHref(value: string): string | null {
  const trimmed = value.trim();
  if (isUrl(trimmed)) return trimmed;
  if (BARE_DOMAIN_RE.test(trimmed)) return `https://${trimmed}`;
  return null;
}
