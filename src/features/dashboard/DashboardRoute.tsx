'use client'

import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { Dashboard } from './Dashboard'

export function DashboardRoute() {
  const { applications } = useAppData()
  return <Dashboard applications={applications} navigate={useNavigate()} />
}
