import { Suspense } from 'react'
import { ApplicationsRoute } from '../../src/App'

export default function Page() {
  return <Suspense fallback={<div className="page" />}><ApplicationsRoute /></Suspense>
}
