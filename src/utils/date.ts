const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const pad2 = (value: number) => String(value).padStart(2, '0')
/** Local calendar date as yyyy-MM-dd (never the UTC date). */
export const calendarDateKey = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}
/** Today's local date as yyyy-MM-dd; use it for date-input max values and future-date checks. */
export const todayKey = () => calendarDateKey(new Date())
export const formatDate = (value?: string) => value ? dateFormatter.format(new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`)) : '—'
export const formatDateTime = (value?: string) => value ? dateTimeFormatter.format(new Date(value)) : '—'
export const toInputDateTime = (value?: string) => value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

// Relative date helpers. Callers pass `now` explicitly and only call these on the client after `ready`, never during SSR.
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const toDate = (value: Date | string) => typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value
/** Whole local calendar days from `now` to `value` (negative in the past). A bare 'yyyy-MM-dd' string is read as a local date. */
export const calendarDayDiff = (value: Date | string, now: Date) => {
  const date = toDate(value)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((start.getTime() - today.getTime()) / 864e5)
}
/** 'HH:mm' in local time. */
export const formatTime = (value: Date | string) => { const date = toDate(value); return `${pad2(date.getHours())}:${pad2(date.getMinutes())}` }
/** 'Thứ Ba, 13/10': the long weekday and the day/month of `value`. */
export const formatWeekdayDate = (value: Date) => `${WEEKDAY_LONG[value.getDay()]}, ${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}`
/** 'Hôm nay' | 'Ngày mai' | 'Hôm qua' | 'T5 15/10' (the year is added when it differs from `now`). */
export const formatRelativeDay = (value: Date | string, now: Date) => {
  const date = toDate(value)
  const diff = calendarDayDiff(date, now)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Ngày mai'
  if (diff === -1) return 'Hôm qua'
  const year = date.getFullYear() === now.getFullYear() ? '' : `/${date.getFullYear()}`
  return `${WEEKDAY_SHORT[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}${year}`
}
/** 'Quá hạn 2 ngày' | 'Quá hạn từ 09:00' | 'Hôm nay 16:00' | 'Ngày mai 09:00' | 'T5 15/10 · 16:00'. */
export const formatDueLabel = (iso: string, now: Date) => {
  const due = new Date(iso)
  const diff = calendarDayDiff(due, now)
  if (due.getTime() < now.getTime()) return diff < 0 ? `Quá hạn ${-diff} ngày` : `Quá hạn từ ${formatTime(iso)}`
  if (diff === 0 || diff === 1) return `${formatRelativeDay(due, now)} ${formatTime(iso)}`
  return `${formatRelativeDay(due, now)} · ${formatTime(iso)}`
}
/** 'Vừa xong' | '5 phút trước' | '2 giờ trước' | 'Hôm qua 16:00' | 'dd/MM/yyyy HH:mm'. */
export const formatTimeAgo = (iso: string, now: Date) => {
  const date = new Date(iso)
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const diff = calendarDayDiff(date, now)
  if (diff === 0) return `${Math.floor(minutes / 60)} giờ trước`
  if (diff === -1) return `Hôm qua ${formatTime(iso)}`
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${formatTime(iso)}`
}
