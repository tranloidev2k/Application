'use client'

import { ChevronDown, Mail } from 'lucide-react'
import { Field } from '../../../components/ui/Field'
import { FormSection } from '../../../components/ui/FormSection'
import { ApplicationDraft, countFilled, DraftErrors, DraftField, MORE_FIELDS } from './applicationDraft'

/** Section 03 inside a disclosure: the long, optional fields. The form opens it when it holds a validation error. */
export function MoreDetailsSection({ draft, errors, set, open, onToggle, onContactEmailBlur }: {
  draft: ApplicationDraft
  errors: DraftErrors
  set: (field: DraftField, value: string) => void
  open: boolean
  onToggle: (open: boolean) => void
  onContactEmailBlur: () => void
}) {
  const filled = countFilled(draft, MORE_FIELDS)
  return <details className="form-more" open={open} onToggle={event => onToggle(event.currentTarget.open)}>
    <summary>
      <span className="form-more-text">
        <strong>Thêm chi tiết (không bắt buộc)</strong>
        <small>Mô tả công việc, CV đã gửi, người liên hệ, ghi chú</small>
      </span>
      {filled > 0 && <span className="form-more-count">Đã điền {filled}</span>}
      <ChevronDown className="form-more-chevron" size={18} aria-hidden="true" />
    </summary>
    <FormSection number="03" title="Tài liệu & liên hệ" description="Lưu lại CV đã gửi và người bạn trao đổi.">
      <div className="form-grid two">
        <Field label="Mô tả công việc" wide>
          <textarea name="description" rows={4} maxLength={3000} value={draft.description} onChange={event => set('description', event.target.value)} placeholder="Yêu cầu chính, trách nhiệm, điều bạn quan tâm..." />
        </Field>
        <Field label="Nội dung CV đã sử dụng" wide>
          <textarea name="cvContent" className="cv-input" rows={5} maxLength={50000} value={draft.cvContent} onChange={event => set('cvContent', event.target.value)} placeholder="Dán toàn bộ nội dung CV đã gửi cho vị trí này..." />
        </Field>
        <Field label="Người liên hệ">
          <input name="contactName" enterKeyHint="next" maxLength={120} value={draft.contactName} onChange={event => set('contactName', event.target.value)} placeholder="Tên recruiter / hiring manager" />
        </Field>
        <Field label="Email liên hệ" error={errors.contactEmail}>
          {control => <div className="input-icon">
            <Mail size={17} aria-hidden="true" />
            <input {...control} name="contactEmail" type="email" inputMode="email" autoComplete="email" enterKeyHint="next" maxLength={254} value={draft.contactEmail} onChange={event => set('contactEmail', event.target.value)} onBlur={onContactEmailBlur} placeholder="recruiter@company.com" />
          </div>}
        </Field>
        <Field label="Ghi chú nhanh" wide>
          <textarea name="notes" rows={3} maxLength={2000} value={draft.notes} onChange={event => set('notes', event.target.value)} placeholder="Bất kỳ điều gì bạn muốn ghi nhớ..." />
        </Field>
      </div>
    </FormSection>
  </details>
}
