import { MapPin, Phone, Video } from 'lucide-react'
import { Interview } from '../../../types'
import { isHttpUrl } from '../../../utils/url'

export const INTERVIEW_FORMAT_ICONS = { online: Video, onsite: MapPin, phone: Phone } as const

/** Where the interview happens: a 'Tham gia' link for a meeting URL, otherwise the address or phone number as text. */
export function InterviewPlace({ interview }: { interview: Interview }) {
  const place = interview.locationOrMeetingUrl?.trim()
  if (!place) return null
  if (isHttpUrl(place) && !interview.cancelledAt) {
    return <a className="secondary compact join-link" href={place} target="_blank" rel="noopener noreferrer">
      <Video size={15} aria-hidden="true" /> Tham gia<span className="sr-only"> {interview.title} (mở trong tab mới)</span>
    </a>
  }
  const Icon = interview.format === 'phone' ? Phone : MapPin
  return <span className="interview-place"><Icon size={15} aria-hidden="true" />{place}</span>
}
