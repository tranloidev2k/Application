'use client'

import { useId } from 'react'
import { Check, Clock3, ListPlus, Mail, Plus, Send, Sparkles } from 'lucide-react'
import { Application, JobTask } from '../../../types'
import { calendarDayDiff, formatAgo, formatDate, formatDueLabel } from '../../../utils/date'
import { firstOpenTask, nextInterview } from '../../../utils/nextAction'
import { INTERVIEW_FORMAT_ICONS, InterviewPlace } from './InterviewPlace'

const FOLLOW_UP_AFTER_MS = 7 * 864e5

function deadlineCopy(days: number) {
  if (days > 0) return `Còn ${days} ngày để nộp`
  if (days === 0) return 'Hôm nay là hạn nộp'
  return `Đã quá hạn nộp ${-days} ngày`
}

/**
 * 'Bước tiếp theo', derived from the application's own data: the next interview, the most pressing open task
 * (completable in place), the days left to apply, one status nudge, and a final 'Thêm việc cần làm'.
 * Time-based rows wait for the client clock (`now` is null until then).
 */
export function NextStepCard({ application, now, onCompleteTask, onMarkApplied, onAddTask }: {
  application: Application
  now: Date | null
  onCompleteTask: (task: JobTask) => void
  onMarkApplied: () => void
  onAddTask: (initialTitle?: string) => void
}) {
  const titleId = useId()
  const { status } = application
  const interview = now ? nextInterview(application, now) : undefined
  const task = firstOpenTask(application)
  const taskOverdue = Boolean(now && task?.dueAt && new Date(task.dueAt).getTime() < now.getTime())
  const deadlineDays = now && status === 'SAVED' && application.deadlineAt ? calendarDayDiff(application.deadlineAt, now) : null
  const stale = Boolean(now && (status === 'APPLIED' || status === 'SCREENING') && now.getTime() - new Date(application.updatedAt).getTime() > FOLLOW_UP_AFTER_MS)
  const FormatIcon = interview ? INTERVIEW_FORMAT_ICONS[interview.format] ?? Clock3 : Clock3
  const followUpHref = application.contactEmail
    ? `mailto:${application.contactEmail}?subject=${encodeURIComponent(`Theo dõi đơn ứng tuyển ${application.jobTitle}`)}`
    : null

  return <section className="panel next-step" aria-labelledby={titleId}>
    <h3 id={titleId}><Sparkles size={16} aria-hidden="true" /> Bước tiếp theo</h3>
    <ul className="next-step-list">
      {interview && now && <li className="next-step-item">
        <span className="next-step-icon interview" aria-hidden="true"><FormatIcon size={16} /></span>
        <div className="next-step-copy">
          <strong>{interview.title || 'Phỏng vấn'}</strong>
          <small>{formatDueLabel(interview.startsAt, now)}</small>
          <InterviewPlace interview={interview} />
        </div>
      </li>}
      {task && <li className={`next-step-item ${taskOverdue ? 'overdue' : ''}`}>
        <button type="button" className="task-check" onClick={() => onCompleteTask(task)} aria-label={`Hoàn thành: ${task.title}`} title="Đánh dấu hoàn thành">
          <span className="task-check-circle"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
        </button>
        <div className="next-step-copy">
          <strong>{task.title}</strong>
          <small className={taskOverdue ? 'danger-text' : undefined}>{task.dueAt && now ? formatDueLabel(task.dueAt, now) : 'Không có hạn'}</small>
        </div>
      </li>}
      {deadlineDays !== null && <li className={`next-step-item ${deadlineDays < 0 ? 'overdue' : ''}`}>
        <span className="next-step-icon deadline" aria-hidden="true"><Clock3 size={16} /></span>
        <div className="next-step-copy">
          <strong className={deadlineDays < 0 ? 'danger-text' : undefined}>{deadlineCopy(deadlineDays)}</strong>
          <small>Hạn nộp {formatDate(application.deadlineAt)}</small>
        </div>
      </li>}
      {status === 'SAVED' && <li>
        <button type="button" className="next-step-action" onClick={onMarkApplied}><Send size={16} aria-hidden="true" /> Đánh dấu đã ứng tuyển</button>
      </li>}
      {stale && now && <li>
        {followUpHref
          ? <a className="next-step-action" href={followUpHref}><Mail size={16} aria-hidden="true" /> Gửi email follow-up</a>
          : <button type="button" className="next-step-action" onClick={() => onAddTask('Gửi email follow-up')}><Mail size={16} aria-hidden="true" /> Thêm việc: gửi follow-up</button>}
        <small className="next-step-hint">Chưa có cập nhật từ {formatAgo(application.updatedAt, now)}</small>
      </li>}
      {status === 'OFFER' && <li>
        <button type="button" className="next-step-action" onClick={() => onAddTask('Phản hồi offer')}><ListPlus size={16} aria-hidden="true" /> Thêm việc: phản hồi offer</button>
      </li>}
      <li>
        <button type="button" className="next-step-action subtle" onClick={() => onAddTask()}><Plus size={16} aria-hidden="true" /> Thêm việc cần làm</button>
      </li>
    </ul>
  </section>
}
