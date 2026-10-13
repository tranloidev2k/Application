import { Application } from '../../types'

export type SetupStep = {
  id: 'application' | 'plan' | 'calendar'
  label: string
  hint: string
  done: boolean
  action?: { label: string; href: string; primary?: boolean }
}

/** The three onboarding steps; each one ticks itself from existing data or the calendar-visited flag. */
export function buildSetupSteps(apps: Application[], personalTaskCount: number, calendarVisited: boolean): SetupStep[] {
  const latest = apps.reduce<Application | undefined>((best, app) => !best || app.updatedAt > best.updatedAt ? app : best, undefined)
  return [
    {
      id: 'application', label: 'Thêm đơn ứng tuyển đầu tiên', hint: 'Chỉ cần tên công ty và vị trí, phần còn lại bổ sung sau.',
      done: apps.length > 0, action: { label: 'Thêm đơn đầu tiên', href: '/applications/new', primary: true },
    },
    {
      id: 'plan', label: 'Lên lịch phỏng vấn hoặc thêm việc cần làm', hint: 'Mở một đơn để thêm buổi phỏng vấn hoặc việc cần làm có hạn.',
      done: personalTaskCount > 0 || apps.some(app => app.interviews.length > 0 || app.tasks.length > 0),
      action: latest ? { label: 'Mở đơn', href: `/applications/${latest.id}` } : undefined,
    },
    {
      id: 'calendar', label: 'Mở lịch tuần để sắp xếp công việc', hint: 'Kéo trên lịch để tạo việc, kéo thẻ để đổi giờ.',
      done: calendarVisited, action: { label: 'Mở lịch tuần', href: '/calendar?view=week' },
    },
  ]
}
