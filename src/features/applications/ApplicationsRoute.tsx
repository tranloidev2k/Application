'use client'

import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { ApplicationsPage } from './ApplicationsPage'

export function ApplicationsRoute() {
  const { applications, updateApplication, toast, syncState, ready } = useAppData()
  const navigate = useNavigate()
  return <ApplicationsPage applications={applications} navigate={navigate} updateApplication={updateApplication} toast={toast} syncState={syncState} ready={ready} />
}
