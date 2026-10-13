import { Interview } from '../types'

/** Vietnamese names of the interview formats, as offered in the interview form. */
export const INTERVIEW_FORMAT_LABEL: Record<Interview['format'], string> = {
  online: 'Trực tuyến',
  onsite: 'Tại văn phòng',
  phone: 'Điện thoại',
}
