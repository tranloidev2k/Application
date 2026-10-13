'use client'

import { Sparkles } from 'lucide-react'
import type { SetupStep } from './onboardingSteps'
import { SetupSteps } from './SetupSteps'
import { StatusPipeline } from './StatusPipeline'

/** First run (no applications yet): a welcome, the setup checklist and a muted preview of the pipeline, instead of zeros. */
export function GettingStarted({ steps }: { steps: SetupStep[] }) {
  return <>
    <section className="panel getting-started" aria-labelledby="getting-started-title">
      <div className="getting-started-intro">
        <span className="getting-started-icon" aria-hidden="true"><Sparkles size={22} /></span>
        <h2 id="getting-started-title">Chào mừng đến Trackly</h2>
        <p>Theo dõi mọi đơn ứng tuyển, lịch phỏng vấn và việc cần làm ở một nơi.</p>
      </div>
      <SetupSteps steps={steps} />
    </section>
    <StatusPipeline ghost />
  </>
}
