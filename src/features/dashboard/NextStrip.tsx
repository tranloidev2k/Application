'use client'

import type { NextAction } from './dashboardData'
import { NextCard } from './NextCard'

/** 'Việc nên làm tiếp': up to three ranked cards. Renders nothing when there is nothing to suggest. */
export function NextStrip({ actions }: { actions: NextAction[] }) {
  if (!actions.length) return null
  return <section className="next-strip" aria-labelledby="next-strip-title">
    <h2 id="next-strip-title" className="dashboard-section-title">Việc nên làm tiếp</h2>
    <div className="next-strip-cards">
      {actions.map(action => <NextCard key={action.id} action={action} />)}
    </div>
  </section>
}
