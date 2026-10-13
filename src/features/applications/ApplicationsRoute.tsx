'use client'

import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { ApplicationsPage } from './ApplicationsPage'
import { softDeleteApplication } from './softDeleteApplication'

export function ApplicationsRoute() {
  const { applications, updateApplication, toast } = useAppData()
  return <ApplicationsPage applications={applications} navigate={useNavigate()} onDelete={id => softDeleteApplication(id, updateApplication, toast)} />
}
