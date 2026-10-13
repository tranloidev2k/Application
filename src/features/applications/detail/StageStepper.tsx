'use client'

import { Check } from 'lucide-react'
import { Status, STATUS_META } from '../../../types'
import { CLOSED_STATUSES, isClosedStatus, PIPELINE_STAGES } from '../../../utils/status'
import { StatusMenu } from '../../../components/ui/StatusMenu'

type StageState = 'done' | 'current' | 'upcoming' | 'muted'

/**
 * The pipeline SAVED → OFFER as connected segments: done stages filled, the current one in its status tone
 * (aria-current="step"), later ones outlined. Clicking a segment moves the application there through the shared
 * status rule. It ends with 'Đóng đơn ▾' (Bị từ chối / Đã rút, or any status via StatusModal). A closed application
 * shows muted segments that reopen it, and its closed status badge as that menu.
 */
export function StageStepper({ status, onSelect, onOtherStatus }: { status: Status; onSelect: (status: Status) => void; onOtherStatus: () => void }) {
  const closed = isClosedStatus(status)
  const currentIndex = PIPELINE_STAGES.indexOf(status)
  const extraAction = { label: 'Chọn trạng thái khác…', onSelect: onOtherStatus }

  return <div className={`stage-stepper ${closed ? 'closed' : ''}`}>
    <ol className="stage-track" aria-label={closed ? 'Giai đoạn ứng tuyển (đơn đã đóng, chọn để mở lại)' : 'Giai đoạn ứng tuyển'}>
      {PIPELINE_STAGES.map((stage, index) => {
        const meta = STATUS_META[stage]
        const state: StageState = closed ? 'muted' : index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
        const hint = closed ? `Mở lại đơn ở giai đoạn ${meta.label}` : state === 'current' ? 'Giai đoạn hiện tại' : `Chuyển sang ${meta.label}`
        return <li key={stage} className={`stage ${state} ${meta.tone}`}>
          <button type="button" className="stage-step" aria-current={state === 'current' ? 'step' : undefined} title={hint} onClick={() => onSelect(stage)}>
            <span className="stage-bar" aria-hidden="true" />
            <span className="stage-label">
              {state === 'done' && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
              {meta.label}
              {state === 'done' && <span className="sr-only"> (đã qua)</span>}
            </span>
          </button>
        </li>
      })}
    </ol>
    <div className="stage-close">
      {closed
        ? <StatusMenu status={status} statuses={CLOSED_STATUSES} onSelect={onSelect} extraAction={extraAction} />
        : <StatusMenu variant="button" label="Đóng đơn" status={status} statuses={CLOSED_STATUSES} onSelect={onSelect} extraAction={extraAction} />}
    </div>
  </div>
}
