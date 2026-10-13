'use client'

import { useEffect } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useNavigate } from '../../hooks/useNavigate'
import { CALENDAR_VISITED_FLAG, writeStoredFlag } from '../../utils/storedFlag'
import { CalendarPage } from './CalendarPage'

export function CalendarRoute() {
  const { applications, updateApplication, toast } = useAppData()
  // Ticks the dashboard's onboarding step "open the week calendar".
  useEffect(() => writeStoredFlag(CALENDAR_VISITED_FLAG), [])
  return <CalendarPage applications={applications} navigate={useNavigate()} updateApplication={updateApplication} toast={toast} />
}
