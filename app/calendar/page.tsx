import { Suspense } from 'react'
import { CalendarRoute } from '../../src/features/calendar/CalendarRoute'

export default function Page() {
  return <Suspense fallback={<div className="page calendar-page" />}><CalendarRoute /></Suspense>
}
