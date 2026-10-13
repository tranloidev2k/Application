import type { PersonalTask } from '../types'
import { supabase } from './supabase'

type PersonalTaskRow = {
  id: string
  title: string
  note: string | null
  starts_at: string
  ends_at: string
  completed_at: string | null
  updated_at: string
}

const COLUMNS = 'id, title, note, starts_at, ends_at, completed_at, updated_at'

function client() {
  if (!supabase) throw new Error('Thiếu cấu hình Supabase')
  return supabase
}

const fromRow = (row: PersonalTaskRow): PersonalTask => ({
  id: row.id,
  title: row.title,
  note: row.note ?? undefined,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  completedAt: row.completed_at ?? undefined,
  updatedAt: row.updated_at,
})

export async function fetchPersonalTasks(): Promise<PersonalTask[]> {
  const { data, error } = await client()
    .from('personal_tasks')
    .select(COLUMNS)
    .order('starts_at')
  if (error) throw error
  return ((data ?? []) as PersonalTaskRow[]).map(fromRow)
}

export async function savePersonalTask(task: PersonalTask) {
  const { error } = await client()
    .from('personal_tasks')
    .upsert({
      id: task.id,
      title: task.title,
      note: task.note || null,
      starts_at: task.startsAt,
      ends_at: task.endsAt,
      completed_at: task.completedAt || null,
      updated_at: task.updatedAt,
    }, { onConflict: 'id' })
  if (error) throw error
}

export async function deletePersonalTask(id: string) {
  const { error } = await client().from('personal_tasks').delete().eq('id', id)
  if (error) throw error
}
