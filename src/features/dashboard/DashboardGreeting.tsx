'use client'

import { formatWeekdayDate } from '../../utils/date'
import { greetingFor } from './dashboardData'

/** Replaces the page title: a time-of-day greeting, today's date and one sentence about what is pending. Client-only (clock). */
export function DashboardGreeting({ now, summary }: { now: Date; summary?: string }) {
  return <header className="dashboard-greeting">
    <p className="dashboard-date">{formatWeekdayDate(now)}</p>
    <h1>{greetingFor(now)}</h1>
    {summary && <p className="dashboard-summary">{summary}</p>}
  </header>
}
