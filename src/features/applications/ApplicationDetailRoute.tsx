'use client'

import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useApplicationById } from '../../hooks/useApplicationById'
import { useNavigate } from '../../hooks/useNavigate'
import { DetailSkeleton } from '../../components/ui/DetailSkeleton'
import { NotFound } from '../../components/NotFound'
import { ApplicationDetail } from './ApplicationDetail'
import { softDeleteApplication } from './softDeleteApplication'

export function ApplicationDetailRoute({ id }: { id: string }) {
  const navigate = useNavigate()
  const { updateApplication, toast } = useAppData()
  const { application, loading } = useApplicationById(id)
  // Set on delete so the frame before navigation lands shows the skeleton, not "Không tìm thấy".
  const [leaving, setLeaving] = useState(false)
  if (!application) return loading || leaving ? <DetailSkeleton /> : <NotFound navigate={navigate} />
  // Keyed by id: tab, dialogs and expanded text start fresh when another application opens in the same route.
  return <ApplicationDetail
    key={application.id}
    application={application}
    updateApplication={updateApplication}
    onDelete={() => {
      setLeaving(true)
      softDeleteApplication(id, updateApplication, toast)
      navigate('/applications')
    }}
    navigate={navigate}
    toast={toast}
  />
}
