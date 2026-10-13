'use client'

import type { DashboardData, NextAction, TaskGroup, TaskItem } from './dashboardData'
import { summarySentence } from './dashboardData'
import type { SetupStep } from './onboardingSteps'
import { DashboardGreeting } from './DashboardGreeting'
import { GettingStarted } from './GettingStarted'
import { KpiGrid } from './KpiGrid'
import { NextStrip } from './NextStrip'
import { SchedulePanel } from './SchedulePanel'
import { SetupCard } from './SetupCard'
import { StatusPipeline } from './StatusPipeline'
import { TasksPanel } from './TasksPanel'

type DashboardProps = {
  data: DashboardData
  now: Date
  nextActions: NextAction[]
  taskGroups: TaskGroup[]
  setupSteps: SetupStep[]
  showSetupCard: boolean
  onDismissSetup: () => void
  onCompleteTask: (item: TaskItem) => void
}

/** Order: greeting → next strip → KPI tiles → [tasks | schedule] → pipeline. A brand-new user gets the welcome checklist instead. */
export function Dashboard({ data, now, nextActions, taskGroups, setupSteps, showSetupCard, onDismissSetup, onCompleteTask }: DashboardProps) {
  const firstRun = data.apps.length === 0
  return <div className="page dashboard-page">
    <DashboardGreeting now={now} summary={firstRun ? undefined : summarySentence(data)} />
    {firstRun ? <GettingStarted steps={setupSteps} /> : <>
      <NextStrip actions={nextActions} />
      <KpiGrid data={data} now={now} />
      {showSetupCard && <SetupCard steps={setupSteps} onDismiss={onDismissSetup} />}
      <div className="dashboard-grid">
        <TasksPanel groups={taskGroups} undatedCount={data.undatedTaskCount} hasApplications={data.apps.length > 0} calendarHref={data.calendarHref} onComplete={onCompleteTask} />
        <SchedulePanel interviews={data.interviews} now={now} calendarHref={data.calendarHref} />
      </div>
      <StatusPipeline counts={data.statusCounts} total={data.apps.length} />
    </>}
  </div>
}
