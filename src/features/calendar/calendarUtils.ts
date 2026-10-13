import { Application, JobTask, PersonalTask } from '../../types'

export type CalendarView = 'month' | 'week'
export type CalendarEvent = {
  id: string
  kind: 'task' | 'interview' | 'personal'
  title: string
  startsAt: string
  endsAt?: string
  completedAt?: string
  note?: string
  application?: Application
  task?: JobTask
  personal?: PersonalTask
}

export const startOfCalendarWeek = (value: Date) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
}
export const addCalendarDays = (value: Date, amount: number) => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}
export const calendarStateFromParams = (params: { get: (name: string) => string | null }) => {
  const view: CalendarView = params.get('view') === 'month' ? 'month' : 'week'
  const dateValue = params.get('date')
  const parsedDate = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date()
  const cursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  return { view, cursor }
}
