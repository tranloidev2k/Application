import { Application, Interview, JobTask, PersonalTask, Status, STATUSES } from '../../types'
import { calendarDateKey, calendarDayDiff, formatDueLabel, formatRelativeDay, formatTime } from '../../utils/date'
import { isActiveApplication } from '../../utils/status'

// Pure selectors for the dashboard. Everything here depends on `now`, so it only runs on the client after `ready`.

const DAY_MS = 864e5
const DEADLINE_WINDOW_DAYS = 3
const FOLLOW_UP_AFTER_DAYS = 14

export type InterviewItem = Interview & { app: Application }
export type TaskItem =
  | { kind: 'job'; id: string; title: string; dueAt: string; label: string; overdue: boolean; app: Application; task: JobTask }
  | { kind: 'personal'; id: string; title: string; dueAt: string; label: string; overdue: false; task: PersonalTask }
export type TaskGroup = { key: 'overdue' | 'today' | 'week'; label: string; items: TaskItem[] }
export type NextActionKind = 'overdue' | 'task' | 'interview' | 'deadline' | 'followup'
export type NextAction = {
  id: string
  kind: NextActionKind
  eyebrow: string
  title: string
  meta: string
  href: string
  action?: { label: string; href: string; external: boolean }
}

export type DashboardData = {
  /** Non-deleted applications. */
  apps: Application[]
  /** Non-cancelled interviews with startsAt in [now, now + 7d], soonest first. */
  interviews: InterviewItem[]
  /** Open application tasks with dueAt <= now + 7d (overdue included), soonest first. */
  dueTasks: Extract<TaskItem, { kind: 'job' }>[]
  overdueCount: number
  undatedTaskCount: number
  activeCount: number
  statusCounts: Record<Status, number>
  /** Applications whose deadline is within DEADLINE_WINDOW_DAYS and that are still only saved. */
  expiringSaved: Application[]
  calendarHref: string
}

export const ACTIVE_FILTER_HREF = '/applications?status=APPLIED,SCREENING,INTERVIEW'
export const isMeetingUrl = (value?: string) => !!value && /^https?:\/\//i.test(value.trim())

export function buildDashboardData(applications: Application[], now: Date): DashboardData {
  const nowTime = now.getTime()
  const horizon = nowTime + 7 * DAY_MS
  const apps = applications.filter(app => !app.deletedAt)

  const interviews = apps.flatMap(app => app.interviews
    .filter(interview => {
      const startsAt = new Date(interview.startsAt).getTime()
      return !interview.cancelledAt && startsAt >= nowTime && startsAt <= horizon
    })
    .map(interview => ({ ...interview, app })))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  const dueTasks = apps.flatMap(app => app.tasks
    .filter(task => !task.completedAt && task.dueAt && new Date(task.dueAt).getTime() <= horizon)
    .map(task => {
      const dueAt = task.dueAt as string
      return { kind: 'job' as const, id: task.id, title: task.title, dueAt, label: formatDueLabel(dueAt, now), overdue: new Date(dueAt).getTime() < nowTime, app, task }
    }))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  const statusCounts = Object.fromEntries(STATUSES.map(status => [status, 0])) as Record<Status, number>
  apps.forEach(app => { statusCounts[app.status] += 1 })

  const expiringSaved = apps
    .filter(app => {
      if (app.status !== 'SAVED' || !app.deadlineAt) return false
      const days = calendarDayDiff(app.deadlineAt.slice(0, 10), now)
      return days >= 0 && days <= DEADLINE_WINDOW_DAYS
    })
    .sort((a, b) => (a.deadlineAt || '').localeCompare(b.deadlineAt || ''))

  return {
    apps,
    interviews,
    dueTasks,
    overdueCount: dueTasks.filter(task => task.overdue).length,
    undatedTaskCount: apps.reduce((count, app) => count + app.tasks.filter(task => !task.completedAt && !task.dueAt).length, 0),
    activeCount: apps.filter(isActiveApplication).length,
    statusCounts,
    expiringSaved,
    calendarHref: `/calendar?view=week&date=${calendarDateKey(now)}`,
  }
}

/** Personal calendar tasks that are not done and start between the start of today and now + 7d. They are never "overdue". */
export function personalTaskItems(tasks: PersonalTask[], now: Date): TaskItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const horizon = now.getTime() + 7 * DAY_MS
  return tasks
    .filter(task => {
      const startsAt = new Date(task.startsAt).getTime()
      return !task.completedAt && startsAt >= today && startsAt <= horizon
    })
    .map(task => ({ kind: 'personal' as const, id: task.id, title: task.title, dueAt: task.startsAt, label: `${formatRelativeDay(task.startsAt, now)} ${formatTime(task.startsAt)}–${formatTime(task.endsAt)}`, overdue: false as const, task }))
}

/** 'Quá hạn' / 'Hôm nay' / 'Tuần này' groups (empty groups dropped), each sorted by due time. */
export function groupTasks(items: TaskItem[], now: Date): TaskGroup[] {
  const groups: TaskGroup[] = [
    { key: 'overdue', label: 'Quá hạn', items: [] },
    { key: 'today', label: 'Hôm nay', items: [] },
    { key: 'week', label: 'Tuần này', items: [] },
  ]
  ;[...items]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .forEach(item => {
      const group = item.overdue ? groups[0] : calendarDayDiff(item.dueAt, now) <= 0 ? groups[1] : groups[2]
      group.items.push(item)
    })
  return groups.filter(group => group.items.length)
}

/** Up to three "what next" cards: the most urgent task, the next interview, an expiring deadline, a stale application. */
export function buildNextActions(data: DashboardData, now: Date): NextAction[] {
  const actions: NextAction[] = []
  const task = data.dueTasks[0]
  if (task) actions.push({
    id: `task-${task.id}`, kind: task.overdue ? 'overdue' : 'task', eyebrow: task.label, title: task.title,
    meta: `${task.app.companyName} · ${task.app.jobTitle}`, href: `/applications/${task.app.id}`,
  })

  const interview = data.interviews[0]
  if (interview) actions.push({
    id: `interview-${interview.id}`, kind: 'interview', eyebrow: `${formatRelativeDay(interview.startsAt, now)} · ${formatTime(interview.startsAt)}`,
    title: interview.title, meta: `${interview.app.companyName} · ${interview.app.jobTitle}`, href: `/applications/${interview.app.id}`,
    action: isMeetingUrl(interview.locationOrMeetingUrl) ? { label: 'Tham gia', href: (interview.locationOrMeetingUrl as string).trim(), external: true } : undefined,
  })

  const expiring = data.expiringSaved[0]
  if (expiring?.deadlineAt) {
    const days = calendarDayDiff(expiring.deadlineAt.slice(0, 10), now)
    actions.push({
      id: `deadline-${expiring.id}`, kind: 'deadline', eyebrow: `${days === 0 ? 'Hạn nộp hôm nay' : `Hạn nộp còn ${days} ngày`} — ứng tuyển ngay`,
      title: expiring.jobTitle, meta: expiring.companyName, href: `/applications/${expiring.id}`,
    })
  }

  const stale = data.apps
    .filter(app => app.status === 'APPLIED' && now.getTime() - new Date(app.updatedAt).getTime() > FOLLOW_UP_AFTER_DAYS * DAY_MS)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))[0]
  if (stale) {
    const days = Math.floor((now.getTime() - new Date(stale.updatedAt).getTime()) / DAY_MS)
    actions.push({
      id: `followup-${stale.id}`, kind: 'followup', eyebrow: `Chưa có phản hồi ${days} ngày — gửi follow-up`,
      title: stale.jobTitle, meta: stale.companyName, href: `/applications/${stale.id}`,
      action: stale.contactEmail ? { label: 'Gửi email', href: `mailto:${stale.contactEmail}`, external: false } : undefined,
    })
  }
  return actions.slice(0, 3)
}

const joinVi = (parts: string[]) => parts.length > 1 ? `${parts.slice(0, -1).join(', ')} và ${parts[parts.length - 1]}` : parts[0]

/** The greeting's one-line summary of what is pending. */
export function summarySentence(data: DashboardData) {
  const dueSoon = data.dueTasks.length - data.overdueCount
  const upcoming = [
    dueSoon && `${dueSoon} việc đến hạn`,
    data.interviews.length && `${data.interviews.length} buổi phỏng vấn`,
    data.expiringSaved.length && `${data.expiringSaved.length} hạn nộp hồ sơ`,
  ].filter(Boolean) as string[]
  const parts = [...(data.overdueCount ? [`${data.overdueCount} việc quá hạn`] : []), ...upcoming]
  if (!parts.length) return 'Không có gì gấp — thêm một đơn mới để giữ nhịp.'
  return `Bạn có ${joinVi(parts)}${upcoming.length ? ' trong 7 ngày tới' : ''}.`
}

/** 'Chào buổi sáng' before noon, 'Chào buổi chiều' until 18:00, 'Chào buổi tối' otherwise (local hour). */
export function greetingFor(now: Date) {
  const hour = now.getHours()
  if (hour >= 4 && hour < 12) return 'Chào buổi sáng'
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
