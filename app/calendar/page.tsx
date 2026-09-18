import { Suspense } from 'react'
import { CalendarRoute } from '../../src/App'

export default function Page() {
  return <Suspense fallback={<div className="page calendar-page" />}><CalendarRoute /></Suspense>
}
