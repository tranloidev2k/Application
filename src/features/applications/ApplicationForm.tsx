'use client'

import { FormEvent, KeyboardEvent, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Info } from 'lucide-react'
import { Application } from '../../types'
import { useNavigate } from '../../hooks/useNavigate'
import { useTodayKey } from '../../hooks/useTodayKey'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { todayKey } from '../../utils/date'
import { focusFormControl, focusNextControl } from '../../utils/formControls'
import { PageHeader } from '../../components/layout/PageHeader'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { buildApplication, countFilled, findDuplicate, firstInvalidField, MORE_FIELDS, normalizeDraft, validateDraft } from './form/applicationDraft'
import { DetailsSection } from './form/DetailsSection'
import { FormActions } from './form/FormActions'
import { MainInfoSection } from './form/MainInfoSection'
import { MoreDetailsSection } from './form/MoreDetailsSection'
import { useApplicationDraft } from './form/useApplicationDraft'

export function ApplicationForm({ application, applications, onSave, onCancel }: { application?: Application; applications: Application[]; onSave: (a: Application) => void; onCancel: () => void }) {
  const navigate = useNavigate()
  const today = useTodayKey()
  const form = useApplicationDraft(application)
  const { draft, errors, set } = form
  // Closed for a new application, open when editing or when one of its fields already has a value.
  const [moreOpen, setMoreOpen] = useState(() => Boolean(application) || countFilled(form.initialDraft, MORE_FIELDS) > 0)
  const [saved, setSaved] = useState(false)
  const leave = useUnsavedChangesGuard(form.dirty && !saved)
  const duplicate = findDuplicate(applications, draft.jobUrl, application?.id)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = normalizeDraft(draft)
    const found = validateDraft(values, todayKey())
    const invalid = firstInvalidField(found)
    if (invalid) {
      // Render the errors (and open the disclosure that hides the field) before focusing, so the error is read with the field.
      flushSync(() => {
        form.showErrors(values, found)
        if (MORE_FIELDS.includes(invalid)) setMoreOpen(true)
      })
      focusFormControl(event.currentTarget, invalid)
      return
    }
    setSaved(true)
    onSave(buildApplication(values, application))
  }

  // Ctrl/Cmd+Enter saves from any control; Enter in a single-line input marked enterKeyHint="next" moves to the next control.
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
      return
    }
    const target = event.target
    if (event.shiftKey || event.altKey || !(target instanceof HTMLInputElement) || target.enterKeyHint !== 'next') return
    event.preventDefault()
    focusNextControl(event.currentTarget, target)
  }

  const cancel = () => leave.guard(onCancel)
  return <div className="page form-page">
    <button type="button" className="back-button" onClick={cancel}><ArrowLeft size={17} aria-hidden="true" /> Quay lại</button>
    <PageHeader title={application ? 'Cập nhật đơn ứng tuyển' : 'Thêm đơn ứng tuyển'} subtitle={application ? `${application.jobTitle} · ${application.companyName}` : undefined} />
    <form onSubmit={submit} onKeyDown={onKeyDown} noValidate>
      <MainInfoSection
        draft={draft} errors={errors} set={set} today={today} duplicate={duplicate}
        showAppliedDate={form.showAppliedDate} appliedAutoFilled={form.appliedAutoFilled}
        onStatusChange={form.changeStatus} onJobUrlBlur={form.blurJobUrl}
        onOpenDuplicate={id => leave.guard(() => navigate(`/applications/${id}`))}
      />
      <DetailsSection draft={draft} set={set} />
      <MoreDetailsSection draft={draft} errors={errors} set={set} open={moreOpen} onToggle={setMoreOpen} onContactEmailBlur={form.blurContactEmail} />
      <FormActions editing={Boolean(application)} dirty={form.dirty} onCancel={cancel} />
    </form>
    {/* Outside the <form>: a dialog's buttons must never submit it. */}
    {leave.confirming && <ConfirmModal
      title="Bỏ các thay đổi chưa lưu?"
      description="Bạn đã nhập thông tin nhưng chưa lưu đơn này."
      confirmLabel="Bỏ thay đổi"
      cancelLabel="Tiếp tục chỉnh sửa"
      tone="neutral"
      body={<div className="confirm-warning"><Info size={22} aria-hidden="true" /><p>Nếu rời trang bây giờ, những gì bạn vừa nhập sẽ không được lưu.</p></div>}
      onClose={leave.keepEditing}
      onConfirm={leave.discard}
    />}
  </div>
}
