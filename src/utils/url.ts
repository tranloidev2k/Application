/** True for an absolute http(s) URL, the only kind rendered as a link (never javascript: or other schemes). */
export const isHttpUrl = (value?: string) => Boolean(value && /^https?:\/\/\S+$/i.test(value.trim()))
/** A bare host such as 'topcv.vn' or 'itviec.com/it-jobs/123' (no scheme, at least one dot, a letter TLD). */
const BARE_DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i
/** Trims a typed job link and adds 'https://' when it starts with 'www.' or looks like a bare domain. Anything else is returned trimmed, unchanged. */
export const normalizeJobUrl = (value: string) => {
  const trimmed = value.trim()
  return /^www\./i.test(trimmed) || BARE_DOMAIN.test(trimmed) ? `https://${trimmed}` : trimmed
}
