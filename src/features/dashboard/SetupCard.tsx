'use client'

import { X } from 'lucide-react'
import type { SetupStep } from './onboardingSteps'
import { SetupSteps } from './SetupSteps'

/** Compact onboarding card shown once the first application exists and some steps are still open. Dismissal is permanent. */
export function SetupCard({ steps, onDismiss }: { steps: SetupStep[]; onDismiss: () => void }) {
  const done = steps.filter(step => step.done).length
  return <section className="panel setup-card" aria-labelledby="setup-card-title">
    <div className="setup-card-head">
      <h2 id="setup-card-title">Hoàn tất thiết lập · {done}/{steps.length}</h2>
      <span className="setup-progress" aria-hidden="true"><i style={{ width: `${done / steps.length * 100}%` }} /></span>
      <button type="button" className="icon-button" onClick={onDismiss} aria-label="Ẩn hướng dẫn thiết lập" title="Ẩn hướng dẫn thiết lập"><X size={18} /></button>
    </div>
    <SetupSteps steps={steps} compact />
  </section>
}
