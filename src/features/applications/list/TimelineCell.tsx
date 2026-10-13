import { Application } from '../../../types'
import { calendarDayDiff, formatAgo, formatDayMonth } from '../../../utils/date'

const URGENT_DAYS = 3

/**
 * 'Mốc thời gian' (spec F03: applied date, deadline, last update). A saved application leads with its deadline,
 * red only within URGENT_DAYS; any other status leads with its applied date. The last update is always shown.
 */
export function TimelineCell({ app, now }: { app: Application; now: Date }) {
  const deadline = app.deadlineAt?.slice(0, 10)
  const applied = app.appliedAt?.slice(0, 10)
  let main = null
  if (app.status === 'SAVED') {
    if (deadline) {
      const days = calendarDayDiff(deadline, now)
      const left = days < 0 ? 'Đã quá hạn' : days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`
      main = <span className={`timeline-main ${days <= URGENT_DAYS ? 'urgent' : ''}`}>Hạn nộp {formatDayMonth(deadline, now)} · {left}</span>
    }
  } else if (applied || deadline) {
    main = <span className="timeline-main">
      {applied && `Ứng tuyển ${formatDayMonth(applied, now)}`}
      {deadline && <span className="timeline-muted">{applied ? ' · ' : ''}Hạn nộp {formatDayMonth(deadline, now)}</span>}
    </span>
  }
  return <>
    {main}
    <span className="timeline-updated">Cập nhật {formatAgo(app.updatedAt, now)}</span>
  </>
}
