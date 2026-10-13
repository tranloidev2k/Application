'use client'

import { useState } from 'react'
import { Application, Status } from '../../../types'
import { todayKey } from '../../../utils/date'
import { NEEDS_APPLIED_DATE } from '../../../utils/status'
import { normalizeJobUrl } from '../../../utils/url'
import { ApplicationDraft, appliedAtError, buildDraft, contactEmailError, DraftErrors, DraftField, isSameDraft, jobUrlError } from './applicationDraft'

const withoutError = (errors: DraftErrors, field: DraftField) => {
  if (!errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}

/** Draft state for the add/edit form: values, inline errors, the applied-date rule and the dirty flag. */
export function useApplicationDraft(application?: Application) {
  // A lazy state snapshot, not a ref: the dirty flag is computed during render, where ref.current must not be read.
  const [initialDraft] = useState(() => buildDraft(application))
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<DraftErrors>({})
  // True while the applied date is the one a status change filled in (shows a hint; undone if the status goes back to Đã lưu).
  const [appliedAutoFilled, setAppliedAutoFilled] = useState(false)
  // Keeps the applied-date field on screen when the user clears it while the status is Đã lưu.
  const [appliedTouched, setAppliedTouched] = useState(false)

  /** Edits one field and clears its error right away. */
  const set = (field: DraftField, value: string) => {
    setDraft(current => ({ ...current, [field]: value }))
    setErrors(current => withoutError(current, field))
    if (field === 'appliedAt') {
      setAppliedAutoFilled(false)
      setAppliedTouched(true)
    }
  }

  /** Moving to a status that needs an applied date fills in today when it is empty. */
  const changeStatus = (status: Status) => {
    let appliedAt = draft.appliedAt
    let autoFilled = appliedAutoFilled
    if (NEEDS_APPLIED_DATE.includes(status) && !appliedAt) {
      appliedAt = todayKey()
      autoFilled = true
    } else if (status === 'SAVED' && autoFilled) {
      appliedAt = ''
      autoFilled = false
    }
    setDraft(current => ({ ...current, status, appliedAt }))
    setAppliedAutoFilled(autoFilled)
    setAppliedTouched(false)
    // An applied-date error on screen is re-checked against the new status instead of going stale.
    if (errors.appliedAt) {
      const error = appliedAtError(status, appliedAt, todayKey())
      setErrors(current => error ? { ...current, appliedAt: error } : withoutError(current, 'appliedAt'))
    }
  }

  const blurJobUrl = () => {
    const jobUrl = normalizeJobUrl(draft.jobUrl)
    if (jobUrl !== draft.jobUrl) setDraft(current => ({ ...current, jobUrl }))
    const error = jobUrlError(jobUrl)
    if (error) setErrors(current => ({ ...current, jobUrl: error }))
  }

  const blurContactEmail = () => {
    const contactEmail = draft.contactEmail.trim()
    if (contactEmail !== draft.contactEmail) setDraft(current => ({ ...current, contactEmail }))
    const error = contactEmailError(contactEmail)
    if (error) setErrors(current => ({ ...current, contactEmail: error }))
  }

  /** Shows the result of a failed submit: the normalized values and every error. */
  const showErrors = (values: ApplicationDraft, found: DraftErrors) => {
    setDraft(values)
    setErrors(found)
  }

  return {
    draft, errors, set, changeStatus, blurJobUrl, blurContactEmail, showErrors,
    initialDraft,
    dirty: !isSameDraft(draft, initialDraft),
    appliedAutoFilled,
    // REJECTED and WITHDRAWN may keep an applied date (spec §3), so only an undated Đã lưu hides the field.
    showAppliedDate: draft.status !== 'SAVED' || Boolean(draft.appliedAt) || appliedTouched,
  }
}
