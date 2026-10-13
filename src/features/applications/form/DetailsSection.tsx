'use client'

import { useId } from 'react'
import { MapPin } from 'lucide-react'
import { Field } from '../../../components/ui/Field'
import { FormSection } from '../../../components/ui/FormSection'
import { ApplicationDraft, DraftField } from './applicationDraft'

const SOURCES = ['LinkedIn', 'Website công ty', 'Referral', 'TopCV']

/** Section 02: where, from where, how much and until when. */
export function DetailsSection({ draft, set }: { draft: ApplicationDraft; set: (field: DraftField, value: string) => void }) {
  const sourcesId = useId()
  return <FormSection number="02" title="Chi tiết" description="Hạn nộp hồ sơ sẽ được nhắc trên trang Tổng quan.">
    <div className="form-grid two">
      <Field label="Địa điểm">
        {control => <div className="input-icon">
          <MapPin size={17} aria-hidden="true" />
          <input {...control} name="location" enterKeyHint="next" maxLength={160} value={draft.location} onChange={event => set('location', event.target.value)} placeholder="TP. Hồ Chí Minh" />
        </div>}
      </Field>
      <Field label="Nguồn ứng tuyển">
        <input name="source" list={sourcesId} enterKeyHint="next" maxLength={120} value={draft.source} onChange={event => set('source', event.target.value)} placeholder="LinkedIn, giới thiệu..." />
        <datalist id={sourcesId}>{SOURCES.map(source => <option key={source} value={source} />)}</datalist>
      </Field>
      <Field label="Mức lương">
        <input name="salaryText" enterKeyHint="next" maxLength={100} value={draft.salaryText} onChange={event => set('salaryText', event.target.value)} placeholder="Ví dụ: 30–40 triệu" />
      </Field>
      <Field label="Hạn nộp hồ sơ">
        <input name="deadlineAt" type="date" value={draft.deadlineAt} onChange={event => set('deadlineAt', event.target.value)} />
      </Field>
    </div>
  </FormSection>
}
