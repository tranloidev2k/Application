'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import type { SetupStep } from './onboardingSteps'

/** The onboarding checklist, full (first run) or compact (the 'Hoàn tất thiết lập' card). */
export function SetupSteps({ steps, compact = false }: { steps: SetupStep[]; compact?: boolean }) {
  return <ol className={`setup-steps ${compact ? 'compact' : ''}`}>
    {steps.map((step, index) => <li key={step.id} className={step.done ? 'done' : undefined}>
      <span className="setup-step-marker" aria-hidden="true">{step.done ? <Check size={14} strokeWidth={3} /> : index + 1}</span>
      <span className="setup-step-copy">
        <strong>{step.label}<span className="sr-only">{step.done ? ' (đã xong)' : ' (chưa xong)'}</span></strong>
        {!compact && <small>{step.hint}</small>}
      </span>
      {!step.done && step.action && <Link className={`${step.action.primary ? 'primary' : 'secondary'} compact`} href={step.action.href}>{step.action.label}</Link>}
    </li>)}
  </ol>
}
