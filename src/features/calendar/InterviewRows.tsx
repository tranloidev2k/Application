import { Link2, MapPin, Phone, UserRound, Video } from 'lucide-react'
import { Interview } from '../../types'
import { INTERVIEW_FORMAT_LABEL } from '../../utils/interview'
import { isHttpUrl } from '../../utils/url'

const FORMAT_ICON = { online: Video, onsite: MapPin, phone: Phone } as const

/** The interview rows of the event popover: 'Hình thức', then 'Người phỏng vấn' and 'Địa điểm / Link' when set. */
export function InterviewRows({ interview }: { interview: Interview }) {
  const FormatIcon = FORMAT_ICON[interview.format] ?? Video
  const place = interview.locationOrMeetingUrl?.trim()
  const interviewer = interview.interviewer?.trim()
  const PlaceIcon = place && isHttpUrl(place) ? Link2 : interview.format === 'phone' ? Phone : MapPin
  return <>
    <p><FormatIcon size={17} aria-hidden="true" /><span><small>Hình thức</small><strong>{INTERVIEW_FORMAT_LABEL[interview.format] ?? 'Trực tuyến'}</strong></span></p>
    {interviewer && <p><UserRound size={17} aria-hidden="true" /><span><small>Người phỏng vấn</small><strong>{interviewer}</strong></span></p>}
    {place && <p><PlaceIcon size={17} aria-hidden="true" /><span><small>Địa điểm / Link</small><strong className="calendar-context-place">{place}</strong></span></p>}
  </>
}
