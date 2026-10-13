import { Suspense } from 'react'
import { ApplicationsRoute } from '../../src/features/applications/ApplicationsRoute'

export default function Page() {
  return <Suspense fallback={<div className="page" />}><ApplicationsRoute /></Suspense>
}
