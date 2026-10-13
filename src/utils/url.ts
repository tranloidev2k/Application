/** True for an absolute http(s) URL, the only kind rendered as a link (never javascript: or other schemes). */
export const isHttpUrl = (value?: string) => Boolean(value && /^https?:\/\/\S+$/i.test(value.trim()))
