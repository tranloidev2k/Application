'use client'

import { FormEvent, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, Link2, Mail, MapPin } from 'lucide-react'
import { Application, STATUSES, STATUS_META } from '../../types'
import { useTodayKey } from '../../hooks/useTodayKey'
import { todayKey } from '../../utils/date'
import { uid } from '../../utils/id'
import { applyStatusChange, NEEDS_APPLIED_DATE } from '../../utils/status'
import { PageHeader } from '../../components/layout/PageHeader'
import { Field } from '../../components/ui/Field'
import { FormSection } from '../../components/ui/FormSection'

type ApplicationDraft = Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'activities' | 'appNotes' | 'interviews' | 'tasks'>

export function ApplicationForm({ application, applications, onSave, onCancel }: { application?: Application; applications: Application[]; onSave: (a: Application) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<ApplicationDraft>({
    companyName: application?.companyName || '', jobTitle: application?.jobTitle || '', status: application?.status || 'SAVED',
    jobUrl: application?.jobUrl || '', location: application?.location || '', source: application?.source || '', salaryText: application?.salaryText || '',
    description: application?.description || '', appliedAt: application?.appliedAt || '', deadlineAt: application?.deadlineAt || '',
    cvContent: application?.cvContent || '', contactName: application?.contactName || '', contactEmail: application?.contactEmail || '', notes: application?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (key: keyof ApplicationDraft, value: string) => setDraft(v => ({ ...v, [key]: value || undefined }))
  const duplicate = draft.jobUrl && applications.find(a => a.id !== application?.id && !a.deletedAt && a.jobUrl === draft.jobUrl)
  const needsAppliedDate = NEEDS_APPLIED_DATE.includes(draft.status)
  const today = useTodayKey()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!draft.companyName?.trim()) next.companyName = 'Vui lòng nhập tên công ty'
    if (!draft.jobTitle?.trim()) next.jobTitle = 'Vui lòng nhập vị trí ứng tuyển'
    if (draft.jobUrl && !/^https?:\/\//i.test(draft.jobUrl)) next.jobUrl = 'URL phải bắt đầu bằng http:// hoặc https://'
    if (draft.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)) next.contactEmail = 'Email chưa đúng định dạng'
    if (draft.appliedAt && draft.appliedAt > todayKey()) next.appliedAt = 'Ngày ứng tuyển không thể ở tương lai'
    if (needsAppliedDate && !draft.appliedAt) next.appliedAt = 'Trạng thái này cần ngày ứng tuyển'
    setErrors(next)
    if (Object.keys(next).length) { document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    const now = new Date().toISOString()
    const edited: Application | undefined = application && { ...application, ...draft, companyName: draft.companyName!.trim(), jobTitle: draft.jobTitle!.trim(), updatedAt: now }
    // A status edit goes through the shared rule, so it appends the same STATUS_CHANGED entry as every other path.
    const base: Application = application && edited ? (application.status !== draft.status ? applyStatusChange({ ...edited, status: application.status }, draft.status) : edited) : {
      ...draft, companyName: draft.companyName!.trim(), jobTitle: draft.jobTitle!.trim(), id: uid(), createdAt: now, updatedAt: now,
      activities: [{ id: uid(), type: 'CREATED', createdAt: now, label: 'Đã tạo đơn ứng tuyển' }], appNotes: [], interviews: [], tasks: [],
    }
    onSave(base)
  }

  return <div className="page form-page">
    <button className="back-button" onClick={onCancel}><ArrowLeft size={17} /> Quay lại</button>
    <PageHeader title={application ? 'Cập nhật đơn ứng tuyển' : 'Thêm đơn ứng tuyển'} />
    <form onSubmit={submit} noValidate>
      <FormSection number="01" title="Thông tin cơ bản">
        <div className="form-grid two">
          <Field label="Tên công ty" required error={errors.companyName}><input autoFocus maxLength={120} value={draft.companyName || ''} onChange={e => set('companyName', e.target.value)} placeholder="Ví dụ: VNG Corporation" /></Field>
          <Field label="Vị trí ứng tuyển" required error={errors.jobTitle}><input maxLength={160} value={draft.jobTitle || ''} onChange={e => set('jobTitle', e.target.value)} placeholder="Ví dụ: Product Designer" /></Field>
          <Field label="URL tin tuyển dụng" error={errors.jobUrl}><div className="input-icon"><Link2 size={17} /><input type="url" value={draft.jobUrl || ''} onChange={e => set('jobUrl', e.target.value)} placeholder="https://..." /></div>{duplicate && <button type="button" className="duplicate-warning" onClick={() => window.location.assign(`/applications/${duplicate.id}`)}><AlertCircle size={15} /> URL này đã có trong đơn “{duplicate.jobTitle}”</button>}</Field>
          <Field label="Địa điểm"><div className="input-icon"><MapPin size={17} /><input maxLength={160} value={draft.location || ''} onChange={e => set('location', e.target.value)} placeholder="TP. Hồ Chí Minh" /></div></Field>
        </div>
      </FormSection>
      <FormSection number="02" title="Quá trình ứng tuyển">
        <div className="form-grid three">
          <Field label="Trạng thái"><select value={draft.status} onChange={event => set('status', event.target.value)}>{STATUSES.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</select></Field>
          <Field label="Ngày ứng tuyển" required={needsAppliedDate} error={errors.appliedAt}><input type="date" max={today || undefined} value={draft.appliedAt || ''} onChange={e => set('appliedAt', e.target.value)} /></Field>
          <Field label="Hạn nộp hồ sơ"><input type="date" value={draft.deadlineAt || ''} onChange={e => set('deadlineAt', e.target.value)} /></Field>
          <Field label="Nguồn ứng tuyển"><input list="sources" value={draft.source || ''} onChange={e => set('source', e.target.value)} placeholder="LinkedIn, giới thiệu..." /><datalist id="sources"><option value="LinkedIn" /><option value="Website công ty" /><option value="Referral" /><option value="TopCV" /></datalist></Field>
          <Field label="Mức lương"><input maxLength={100} value={draft.salaryText || ''} onChange={e => set('salaryText', e.target.value)} placeholder="Ví dụ: 30–40 triệu" /></Field>
          <Field label="Nội dung CV đã sử dụng" wide><textarea rows={10} maxLength={50000} value={draft.cvContent || ''} onChange={e => set('cvContent', e.target.value)} placeholder="Dán toàn bộ nội dung CV đã gửi cho vị trí này..." /></Field>
        </div>
      </FormSection>
      <FormSection number="03" title="Thông tin thêm">
        <div className="form-grid two">
          <Field label="Người liên hệ"><input maxLength={120} value={draft.contactName || ''} onChange={e => set('contactName', e.target.value)} placeholder="Tên recruiter / hiring manager" /></Field>
          <Field label="Email liên hệ" error={errors.contactEmail}><div className="input-icon"><Mail size={17} /><input type="email" value={draft.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} placeholder="recruiter@company.com" /></div></Field>
          <Field label="Mô tả công việc" wide><textarea rows={4} maxLength={3000} value={draft.description || ''} onChange={e => set('description', e.target.value)} placeholder="Yêu cầu chính, trách nhiệm, điều bạn quan tâm..." /></Field>
          <Field label="Ghi chú nhanh" wide><textarea rows={3} maxLength={2000} value={draft.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Bất kỳ điều gì bạn muốn ghi nhớ..." /></Field>
        </div>
      </FormSection>
      <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Hủy</button><button className="primary" type="submit"><Check size={18} />{application ? 'Lưu thay đổi' : 'Tạo đơn ứng tuyển'}</button></div>
    </form>
  </div>
}
