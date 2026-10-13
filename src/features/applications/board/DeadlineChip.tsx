import { CalendarClock } from 'lucide-react'
import { calendarDayDiff, formatDayMonth } from '../../../utils/date'

const SOON_DAYS = 3

/** A saved application's 'Hạn nộp' with the days left: amber within SOON_DAYS, red only once it has passed. */
export function DeadlineChip({ deadline, now }: { deadline: string; now: Date }) {
  const day = deadline.slice(0, 10)
  const days = calendarDayDiff(day, now)
  const left = days < 0 ? 'Đã quá hạn' : days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`
  const tone = days < 0 ? 'overdue' : days <= SOON_DAYS ? 'soon' : ''
  return <span className={`deadline-chip ${tone}`}>
    <CalendarClock size={14} aria-hidden="true" />
    Hạn nộp {formatDayMonth(day, now)} · {left}
  </span>
}
