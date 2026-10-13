'use client'

import { Link2 } from 'lucide-react'
import { Application, Status } from '../../../types'
import { NEEDS_APPLIED_DATE } from '../../../utils/status'
import { Field } from '../../../components/ui/Field'
import { FormSection } from '../../../components/ui/FormSection'
import { ApplicationDraft, DraftErrors, DraftField } from './applicationDraft'
import { DuplicateAlert } from './DuplicateAlert'
import { StatusField } from './StatusField'

/** Section 01, the fast path: company, title, job link, status and (once it matters) the applied date. */
export function MainInfoSection({ draft, errors, set, today, duplicate, showAppliedDate, appliedAutoFilled, onStatusChange, onJobUrlBlur, onOpenDuplicate }: {
  draft: ApplicationDraft
  errors: DraftErrors
  set: (field: DraftField, value: string) => void
  today: string
  duplicate?: Application
  showAppliedDate: boolean
  appliedAutoFilled: boolean
  onStatusChange: (status: Status) => void
  onJobUrlBlur: () => void
  onOpenDuplicate: (id: string) => void
}) {
  return <FormSection number="01" title="Thông tin chính" description="Chỉ cần tên công ty và vị trí để bắt đầu.">
    <div className="form-grid two">
      <Field label="Tên công ty" required error={errors.companyName}>
        <input name="companyName" autoFocus autoComplete="organization" enterKeyHint="next" maxLength={120} value={draft.companyName} onChange={event => set('companyName', event.target.value)} placeholder="Ví dụ: VNG Corporation" />
      </Field>
      <Field label="Vị trí ứng tuyển" required error={errors.jobTitle}>
        <input name="jobTitle" enterKeyHint="next" maxLength={160} value={draft.jobTitle} onChange={event => set('jobTitle', event.target.value)} placeholder="Ví dụ: Product Designer" />
      </Field>
      <Field label="URL tin tuyển dụng" wide error={errors.jobUrl}>
        {control => <>
          <div className="input-icon">
            <Link2 size={17} aria-hidden="true" />
            <input {...control} name="jobUrl" type="url" inputMode="url" autoComplete="off" enterKeyHint="next" maxLength={2000} value={draft.jobUrl} onChange={event => set('jobUrl', event.target.value)} onBlur={onJobUrlBlur} placeholder="https://..." />
          </div>
          {duplicate && <DuplicateAlert duplicate={duplicate} onOpen={onOpenDuplicate} />}
        </>}
      </Field>
      <StatusField value={draft.status} onChange={onStatusChange} />
      {showAppliedDate && <Field label="Ngày ứng tuyển" required={NEEDS_APPLIED_DATE.includes(draft.status)} error={errors.appliedAt} hint={appliedAutoFilled ? 'Đã điền ngày hôm nay' : undefined}>
        <input name="appliedAt" type="date" max={today || undefined} value={draft.appliedAt} onChange={event => set('appliedAt', event.target.value)} />
      </Field>}
    </div>
  </FormSection>
}
