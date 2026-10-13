'use client'

import { useAppData } from '../../context/AppDataContext'
import { useApplicationById } from '../../hooks/useApplicationById'
import { useNavigate } from '../../hooks/useNavigate'
import { DetailSkeleton } from '../../components/ui/DetailSkeleton'
import { NotFound } from '../../components/NotFound'
import { ApplicationForm } from './ApplicationForm'

export function EditApplicationRoute({ id }: { id: string }) {
  const navigate = useNavigate()
  const { applications, replaceApplication, toast } = useAppData()
  const { application, loading } = useApplicationById(id)
  if (!application) return loading ? <DetailSkeleton /> : <NotFound navigate={navigate} />
  return <ApplicationForm application={application} applications={applications} onCancel={() => navigate(`/applications/${id}`)} onSave={next => {
    replaceApplication(next)
    toast('Đã lưu thay đổi')
    navigate(`/applications/${next.id}`)
  }} />
}
