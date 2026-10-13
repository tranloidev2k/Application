import { ActivityType, Application, Note } from '../../../types'

export type TimelineEntry = { key: string; type: ActivityType; createdAt: string; label: string; detail?: string; note?: Note }

/**
 * The detail timeline, newest first: every activity plus every current note. A NOTE_ADDED activity whose text is an
 * existing note is dropped, because the note itself is shown (with its delete button), so each note appears once.
 */
export function buildTimelineEntries(application: Application): TimelineEntry[] {
  const noteContents = new Set(application.appNotes.map(note => note.content))
  const activities: TimelineEntry[] = application.activities
    .filter(activity => !(activity.type === 'NOTE_ADDED' && activity.detail !== undefined && noteContents.has(activity.detail)))
    .map(activity => ({ key: `activity-${activity.id}`, type: activity.type, createdAt: activity.createdAt, label: activity.label, detail: activity.detail }))
  const notes: TimelineEntry[] = application.appNotes
    .map(note => ({ key: `note-${note.id}`, type: 'NOTE_ADDED', createdAt: note.createdAt, label: 'Ghi chú', detail: note.content, note }))
  return [...activities, ...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
