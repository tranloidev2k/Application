'use client'

import { useCallback, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useDelayElapsed } from '../../hooks/useDelayElapsed'
import { useNow } from '../../hooks/useNow'
import { usePersonalTasks } from '../../hooks/usePersonalTasks'
import { useStoredFlag } from '../../hooks/useStoredFlag'
import { uid } from '../../utils/id'
import { CALENDAR_VISITED_FLAG, ONBOARDING_DISMISSED_FLAG, writeStoredFlag } from '../../utils/storedFlag'
import { completeJobTask, undoCompleteJobTask } from '../../utils/tasks'
import { Dashboard } from './Dashboard'
import { buildDashboardData, buildNextActions, groupTasks, personalTaskItems, TaskItem } from './dashboardData'
import { DashboardSkeleton } from './DashboardSkeleton'
import { buildSetupSteps } from './onboardingSteps'

/** Longest the skeleton waits for the first sync before showing the normal or first-run view. */
const SKELETON_CAP_MS = 5000

export function DashboardRoute() {
  const { applications, syncState, ready, updateApplication, toast } = useAppData()
  // The context toast is stable, so the personal-task load runs once; a failed load is secondary here and stays silent.
  const personalTasks = usePersonalTasks(toast, true)
  const nowMs = useNow()
  const calendarVisited = useStoredFlag(CALENDAR_VISITED_FLAG)
  const setupDismissed = useStoredFlag(ONBOARDING_DISMISSED_FLAG)
  const skeletonCapped = useDelayElapsed(SKELETON_CAP_MS)

  const now = useMemo(() => new Date(nowMs), [nowMs])
  const data = useMemo(() => buildDashboardData(applications, now), [applications, now])
  const nextActions = useMemo(() => buildNextActions(data, now), [data, now])
  const taskGroups = useMemo(() => groupTasks([...data.dueTasks, ...personalTaskItems(personalTasks.tasks, now)], now), [data, personalTasks.tasks, now])
  const setupSteps = useMemo(() => buildSetupSteps(data.apps, personalTasks.tasks.length, calendarVisited), [data.apps, personalTasks.tasks.length, calendarVisited])

  const { save: savePersonalTask } = personalTasks
  const completeTask = useCallback((item: TaskItem) => {
    const completedAt = new Date().toISOString()
    if (item.kind === 'personal') {
      void savePersonalTask({ ...item.task, completedAt, updatedAt: completedAt }, 'Đã hoàn thành công việc')
      return
    }
    const { app, task } = item
    const activityId = uid()
    updateApplication(app.id, current => completeJobTask(current, task.id, completedAt, activityId))
    // Undo reopens the task and drops only the activity added here; it is not a status transition.
    toast('Đã hoàn thành', { actionLabel: 'Hoàn tác', onAction: () => updateApplication(app.id, current => undoCompleteJobTask(current, task.id, activityId)) })
  }, [savePersonalTask, toast, updateApplication])
  const dismissSetup = useCallback(() => writeStoredFlag(ONBOARDING_DISMISSED_FLAG), [])

  // Time-dependent output waits for the client (`ready`, a real clock); before that, and while the first sync of an
  // empty cache is still connecting (capped at 5s), the skeleton stands in.
  if (!ready || !nowMs || (!skeletonCapped && data.apps.length === 0 && syncState === 'connecting')) return <DashboardSkeleton />

  return <Dashboard
    data={data}
    now={now}
    nextActions={nextActions}
    taskGroups={taskGroups}
    setupSteps={setupSteps}
    showSetupCard={!setupDismissed && data.apps.length > 0 && setupSteps.some(step => !step.done)}
    onDismissSetup={dismissSetup}
    onCompleteTask={completeTask}
  />
}
