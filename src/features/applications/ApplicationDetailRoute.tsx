'use client'

import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useApplicationById } from '../../hooks/useApplicationById'
import { useNavigate } from '../../hooks/useNavigate'
import { useStatusChange } from '../../hooks/useStatusChange'
import { DetailSkeleton } from '../../components/ui/DetailSkeleton'
import { NotFound } from '../../components/NotFound'
import { ApplicationDetail } from './ApplicationDetail'
import { softDeleteApplication } from './softDeleteApplication'

export function ApplicationDetailRoute({ id }: { id: string }) {
  const navigate = useNavigate()
  const { updateApplication, toast } = useAppData()
  const { application, loading } = useApplicationById(id)
  const { commitStatusChange, statusModal } = useStatusChange(updateApplication, toast)
  // Set on delete so the frame before navigation lands shows the skeleton, not "Không tìm thấy".
  const [leaving, setLeaving] = useState(false)
  if (!application) return loading || leaving ? <DetailSkeleton /> : <NotFound navigate={navigate} />
  return <>
    <ApplicationDetail
      application={application}
      update={updater => updateApplication(id, updater)}
      onChangeStatus={(status, appliedAt) => commitStatusChange(application, status, appliedAt)}
      onDelete={() => {
        setLeaving(true)
        softDeleteApplication(id, updateApplication, toast)
        navigate('/applications')
      }}
      navigate={navigate}
      toast={toast}
    />
    {statusModal}
  </>
}
