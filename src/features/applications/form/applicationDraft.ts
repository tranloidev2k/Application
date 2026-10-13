import { Application, Status } from '../../../types'
import { uid } from '../../../utils/id'
import { applyStatusChange, NEEDS_APPLIED_DATE } from '../../../utils/status'
import { isHttpUrl, normalizeJobUrl } from '../../../utils/url'

/** Every editable text field of an Application. The draft keeps them as strings ('' when empty) so dirty checks are exact. */
export const DRAFT_FIELDS = ['companyName', 'jobTitle', 'jobUrl', 'location', 'source', 'salaryText', 'description', 'appliedAt', 'deadlineAt', 'cvContent', 'contactName', 'contactEmail', 'notes'] as const
export type DraftField = typeof DRAFT_FIELDS[number]
export type ApplicationDraft = Record<DraftField, string> & { status: Status }
export type DraftErrors = Partial<Record<DraftField, string>>

/** Fields inside the collapsed 'Thêm chi tiết' disclosure. */
export const MORE_FIELDS: DraftField[] = ['description', 'cvContent', 'contactName', 'contactEmail', 'notes']
/** Validated fields in on-screen order; the first one with an error receives focus. */
const VALIDATION_ORDER: DraftField[] = ['companyName', 'jobTitle', 'jobUrl', 'appliedAt', 'contactEmail']

export function buildDraft(application?: Application): ApplicationDraft {
  const draft = { status: application?.status ?? 'SAVED' } as ApplicationDraft
  for (const field of DRAFT_FIELDS) draft[field] = application?.[field] ?? ''
  return draft
}

export const isSameDraft = (a: ApplicationDraft, b: ApplicationDraft) => a.status === b.status && DRAFT_FIELDS.every(field => a[field] === b[field])
export const countFilled = (draft: ApplicationDraft, fields: DraftField[]) => fields.filter(field => draft[field].trim()).length

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const jobUrlError = (value: string) => value && !isHttpUrl(value) ? 'URL chưa hợp lệ, cần bắt đầu bằng http:// hoặc https://' : undefined
export const contactEmailError = (value: string) => value && !EMAIL_PATTERN.test(value) ? 'Email chưa đúng định dạng' : undefined

export const appliedAtError = (status: Status, appliedAt: string, today: string) =>
  appliedAt && appliedAt > today ? 'Ngày ứng tuyển không thể ở tương lai'
    : !appliedAt && NEEDS_APPLIED_DATE.includes(status) ? 'Trạng thái này cần ngày ứng tuyển'
      : undefined

/** The draft as it will be validated and saved: the job link gets its https:// prefix, the email is trimmed. */
export const normalizeDraft = (draft: ApplicationDraft): ApplicationDraft => ({ ...draft, jobUrl: normalizeJobUrl(draft.jobUrl), contactEmail: draft.contactEmail.trim() })

/** `today` is todayKey(): the local date, so an application sent today is never "in the future". */
export function validateDraft(draft: ApplicationDraft, today: string): DraftErrors {
  const errors: DraftErrors = {}
  if (!draft.companyName.trim()) errors.companyName = 'Vui lòng nhập tên công ty'
  if (!draft.jobTitle.trim()) errors.jobTitle = 'Vui lòng nhập vị trí ứng tuyển'
  const url = jobUrlError(draft.jobUrl)
  if (url) errors.jobUrl = url
  const applied = appliedAtError(draft.status, draft.appliedAt, today)
  if (applied) errors.appliedAt = applied
  const email = contactEmailError(draft.contactEmail)
  if (email) errors.contactEmail = email
  return errors
}

export const firstInvalidField = (errors: DraftErrors) => VALIDATION_ORDER.find(field => errors[field])

/** A live application (not the one being edited) that already uses this job link. */
export const findDuplicate = (applications: Application[], jobUrl: string, ownId?: string) => {
  const url = normalizeJobUrl(jobUrl)
  return url ? applications.find(app => app.id !== ownId && !app.deletedAt && app.jobUrl === url) : undefined
}

/**
 * Turns a valid draft into the saved Application, with the same fields as before: empty text becomes undefined.
 * Creating adds the CREATED entry; an edit that changes the status goes through the shared rule, which appends STATUS_CHANGED.
 */
export function buildApplication(draft: ApplicationDraft, existing?: Application): Application {
  const optional = Object.fromEntries(DRAFT_FIELDS.map(field => [field, draft[field] || undefined])) as Partial<Record<DraftField, string>>
  const fields = { ...optional, companyName: draft.companyName.trim(), jobTitle: draft.jobTitle.trim(), status: draft.status }
  const now = new Date().toISOString()
  if (!existing) return {
    ...fields, id: uid(), createdAt: now, updatedAt: now,
    activities: [{ id: uid(), type: 'CREATED', createdAt: now, label: 'Đã tạo đơn ứng tuyển' }], appNotes: [], interviews: [], tasks: [],
  }
  const edited: Application = { ...existing, ...fields, updatedAt: now }
  return existing.status !== draft.status ? applyStatusChange({ ...edited, status: existing.status }, draft.status) : edited
}
