'use client'

import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { CalendarPage } from './CalendarPage'

export function CalendarRoute() {
  const { applications, updateApplication, toast } = useAppData()
  return <CalendarPage applications={applications} navigate={useNavigate()} updateApplication={updateApplication} toast={toast} />
}
