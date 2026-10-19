import type { PersonalTask } from '../types'
import { toEventColor } from '../utils/eventColors'
import { supabase } from './supabase'

type PersonalTaskRow = {
  id: string
  title: string
  note: string | null
  starts_at: string
  ends_at: string
  completed_at: string | null
  updated_at: string
  /** Missing until migration 20261019000000_add_event_colors has run. */
  color?: string | null
}

export type SavePersonalTaskOptions = {
  /** Also write the colour column (null when the task has none): set when the colour was chosen or cleared. */
  writeColor?: boolean
}

function client() {
  if (!supabase) throw new Error('Thiếu cấu hình Supabase')
  return supabase
}

const fromRow = (row: PersonalTaskRow): PersonalTask => {
  const task: PersonalTask = {
    id: row.id,
    title: row.title,
    note: row.note ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
  }
  const color = toEventColor(row.color)
  if (color) task.color = color
  return task
}

// `select('*')`, not a column list: a database without the colour column yet still loads (rows simply have no colour).
export async function fetchPersonalTasks(): Promise<PersonalTask[]> {
  const { data, error } = await client()
    .from('personal_tasks')
    .select('*')
    .order('starts_at')
  if (error) throw error
  return ((data ?? []) as PersonalTaskRow[]).map(fromRow)
}

/**
 * Upserts one task. The colour column is only sent when the task has a colour or `writeColor` is set, so saving an
 * uncoloured task keeps working on a database that has not run the colour migration yet.
 */
const toRow = (task: PersonalTask, writeColor: boolean) => {
  const row: Record<string, string | null> = {
    id: task.id,
    title: task.title,
    note: task.note || null,
    starts_at: task.startsAt,
    ends_at: task.endsAt,
    completed_at: task.completedAt || null,
    updated_at: task.updatedAt,
  }
  if (task.color || writeColor) row.color = task.color ?? null
  return row
}

export async function savePersonalTask(task: PersonalTask, { writeColor = false }: SavePersonalTaskOptions = {}) {
  const { error } = await client()
    .from('personal_tasks')
    .upsert(toRow(task, writeColor), { onConflict: 'id' })
  if (error) throw error
}

/**
 * Upserts several new tasks in one request (e.g. the copies made by 'Nhân bản'). Like `savePersonalTask`, the colour
 * column is only sent when a task has a colour; if any does, every row carries the key (null for the others) so the
 * batch has one column set.
 */
export async function savePersonalTasks(tasks: PersonalTask[]) {
  if (!tasks.length) return
  const writeColor = tasks.some(task => task.color)
  const { error } = await client()
    .from('personal_tasks')
    .upsert(tasks.map(task => toRow(task, writeColor)), { onConflict: 'id' })
  if (error) throw error
}

export async function deletePersonalTask(id: string) {
  const { error } = await client().from('personal_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function deletePersonalTasks(ids: string[]) {
  if (!ids.length) return
  const { error } = await client().from('personal_tasks').delete().in('id', ids)
  if (error) throw error
}
