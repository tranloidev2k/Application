import { MouseEvent } from 'react'
import { AlertCircle } from 'lucide-react'
import { Application } from '../../../types'

/** Spec F02: a duplicate job link only warns (re-applying can be intentional) and links to the earlier application. */
export function DuplicateAlert({ duplicate, onOpen }: { duplicate: Application; onOpen: (id: string) => void }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks open a new tab and leave this draft alone; a plain click goes through the unsaved-changes guard.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onOpen(duplicate.id)
  }
  return <div className="duplicate-warning" role="status">
    <AlertCircle size={15} aria-hidden="true" />
    <p>Bạn đã lưu tin này: “{duplicate.jobTitle}”</p>
    <a href={`/applications/${duplicate.id}`} onClick={open}>Mở đơn</a>
  </div>
}
