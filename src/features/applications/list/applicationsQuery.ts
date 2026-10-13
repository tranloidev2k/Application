import { Application, Status, STATUSES } from '../../../types'

/** Spec F03: 20 applications per page by default. */
export const PAGE_SIZE = 20

export type SortKey = 'updated' | 'applied' | 'deadline' | 'company'
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated', label: 'Mới cập nhật' },
  { value: 'applied', label: 'Ngày ứng tuyển' },
  { value: 'deadline', label: 'Hạn nộp gần nhất' },
  { value: 'company', label: 'Tên công ty' },
]

/** The 'Đang tiến hành' tab: sent applications that have not reached a closed outcome. */
export const IN_PROGRESS_STATUSES: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER']

const isStatus = (value: string): value is Status => (STATUSES as string[]).includes(value)

/** '?status=APPLIED,INTERVIEW' → valid statuses in canonical order; unknown values are dropped. */
export function parseStatuses(value: string | null): Status[] {
  const wanted = new Set((value || '').split(',').map(part => part.trim()).filter(isStatus))
  return STATUSES.filter(status => wanted.has(status))
}

export const parseSort = (value: string | null): SortKey => SORT_OPTIONS.some(option => option.value === value) ? value as SortKey : 'updated'

export function parsePage(value: string | null) {
  const page = Math.floor(Number(value))
  return Number.isFinite(page) && page > 1 ? page : 1
}

/** Case-insensitive match on company and job title (spec F03). */
export function matchesQuery(app: Application, query: string) {
  const needle = query.trim().toLocaleLowerCase('vi')
  return !needle || `${app.companyName} ${app.jobTitle}`.toLocaleLowerCase('vi').includes(needle)
}

/** Empty values sort last. */
const compareDates = (a?: string, b?: string, direction: 1 | -1 = 1) => {
  if (!a || !b) return a ? -1 : b ? 1 : 0
  return a.localeCompare(b) * direction
}

export function sortApplications(apps: Application[], sort: SortKey) {
  const compare: Record<SortKey, (a: Application, b: Application) => number> = {
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    applied: (a, b) => compareDates(a.appliedAt, b.appliedAt, -1),
    deadline: (a, b) => compareDates(a.deadlineAt?.slice(0, 10), b.deadlineAt?.slice(0, 10)),
    company: (a, b) => a.companyName.localeCompare(b.companyName, 'vi'),
  }
  return [...apps].sort(compare[sort])
}

export function countByStatus(apps: Application[]) {
  const counts = Object.fromEntries(STATUSES.map(status => [status, 0])) as Record<Status, number>
  apps.forEach(app => { counts[app.status] += 1 })
  return counts
}
