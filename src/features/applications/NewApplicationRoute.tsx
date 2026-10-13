'use client'

import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { ApplicationForm } from './ApplicationForm'

export function NewApplicationRoute() {
  const navigate = useNavigate()
  const { applications, createApplication, toast } = useAppData()
  return <ApplicationForm applications={applications} onCancel={() => navigate('/applications')} onSave={application => {
    createApplication(application)
    toast('Đã tạo đơn ứng tuyển')
    navigate(`/applications/${application.id}`)
  }} />
}
