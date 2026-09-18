import type { Application } from '../types'
import { supabase } from './supabase'

type ApplicationRow = {
  data: Application
}

const DEMO_APPLICATION_IDS = new Set(['app-vng', 'app-grab', 'app-momo', 'app-notion', 'app-shopify'])

export function isDemoApplication(application: Application): boolean {
  return DEMO_APPLICATION_IDS.has(application.id)
}

export function normalizeApplication(application: Application): Application {
  const clean = { ...application } as Application & { workMode?: unknown; employmentType?: unknown; cvReference?: unknown }
  delete clean.workMode
  delete clean.employmentType
  delete clean.cvReference
  return clean
}

export async function fetchApplications(): Promise<Application[]> {
  if (!supabase) throw new Error('Thiếu cấu hình Supabase')
  const { data, error } = await supabase
    .from('applications')
    .select('data')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as ApplicationRow[])
    .map(row => normalizeApplication(row.data))
    .filter(application => !isDemoApplication(application))
}

export async function saveApplications(applications: Application[], userId: string) {
  if (!applications.length) return
  if (!supabase) throw new Error('Thiếu cấu hình Supabase')

  const rows = applications.map(application => ({
    id: application.id,
    user_id: userId,
    company_name: application.companyName,
    job_title: application.jobTitle,
    status: application.status,
    job_url: application.jobUrl || null,
    source: application.source || null,
    applied_at: application.appliedAt || null,
    cv_content: application.cvContent || null,
    updated_at: application.updatedAt,
    deleted_at: application.deletedAt || null,
    data: normalizeApplication(application),
  }))

  const { error } = await supabase
    .from('applications')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw error
}
