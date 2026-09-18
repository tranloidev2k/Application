export type Status = 'SAVED' | 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'

export type ActivityType = 'CREATED' | 'STATUS_CHANGED' | 'NOTE_ADDED' | 'INTERVIEW_CREATED' | 'INTERVIEW_UPDATED' | 'INTERVIEW_CANCELLED' | 'TASK_COMPLETED'

export interface Activity {
  id: string
  type: ActivityType
  createdAt: string
  label: string
  detail?: string
}

export interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Interview {
  id: string
  title: string
  startsAt: string
  endsAt: string
  timeZone: string
  format: 'online' | 'onsite' | 'phone'
  locationOrMeetingUrl?: string
  interviewer?: string
  note?: string
  cancelledAt?: string
}

export interface JobTask {
  id: string
  title: string
  note?: string
  dueAt?: string
  endsAt?: string
  completedAt?: string
}

export interface Application {
  id: string
  companyName: string
  jobTitle: string
  status: Status
  jobUrl?: string
  location?: string
  source?: string
  salaryText?: string
  description?: string
  appliedAt?: string
  deadlineAt?: string
  cvContent?: string
  contactName?: string
  contactEmail?: string
  notes?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  activities: Activity[]
  appNotes: Note[]
  interviews: Interview[]
  tasks: JobTask[]
}

export const STATUS_META: Record<Status, { label: string; tone: string }> = {
  SAVED: { label: 'Đã lưu', tone: 'slate' },
  APPLIED: { label: 'Đã ứng tuyển', tone: 'blue' },
  SCREENING: { label: 'Sàng lọc', tone: 'amber' },
  INTERVIEW: { label: 'Phỏng vấn', tone: 'violet' },
  OFFER: { label: 'Nhận offer', tone: 'green' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
  WITHDRAWN: { label: 'Đã rút', tone: 'gray' },
}

export const STATUSES = Object.keys(STATUS_META) as Status[]
