import type { Application } from './types'

const now = new Date()
const at = (days: number, hours = 9) => {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}
const day = (days: number) => at(days).slice(0, 10)

export const seedApplications: Application[] = [
  {
    id: 'app-vng', companyName: 'VNG Corporation', jobTitle: 'Senior Product Designer', status: 'INTERVIEW',
    location: 'Quận 7, TP. Hồ Chí Minh', source: 'LinkedIn',
    salaryText: 'Thỏa thuận', jobUrl: 'https://career.vng.com.vn', appliedAt: day(-8), deadlineAt: day(5),
    cvContent: 'Senior Product Designer với kinh nghiệm thiết kế sản phẩm số, xây dựng design system và cải thiện trải nghiệm người dùng dựa trên dữ liệu.', contactName: 'Minh Anh', contactEmail: 'minhanh@example.com',
    description: 'Thiết kế trải nghiệm cho sản phẩm số phục vụ hàng triệu người dùng.',
    createdAt: at(-12), updatedAt: at(-1, 16),
    activities: [
      { id: 'a1', type: 'INTERVIEW_CREATED', createdAt: at(-1, 16), label: 'Đã lên lịch phỏng vấn', detail: 'Phỏng vấn vòng chuyên môn' },
      { id: 'a2', type: 'STATUS_CHANGED', createdAt: at(-2), label: 'Chuyển sang Phỏng vấn', detail: 'Từ Sàng lọc' },
      { id: 'a3', type: 'STATUS_CHANGED', createdAt: at(-8), label: 'Đã ứng tuyển', detail: 'Từ Đã lưu' },
      { id: 'a4', type: 'CREATED', createdAt: at(-12), label: 'Đã tạo đơn ứng tuyển' },
    ],
    appNotes: [{ id: 'n1', content: 'Team sản phẩm khoảng 8 người. Cần chuẩn bị case study về design system.', createdAt: at(-2, 15), updatedAt: at(-2, 15) }],
    interviews: [{ id: 'i1', title: 'Phỏng vấn vòng chuyên môn', startsAt: at(2, 10), endsAt: at(2, 11), timeZone: 'Asia/Ho_Chi_Minh', format: 'online', locationOrMeetingUrl: 'https://meet.google.com/abc-defg-hij', interviewer: 'Anh Tuấn — Design Lead' }],
    tasks: [{ id: 't1', title: 'Hoàn thiện case study Fintech', note: 'Tập trung vào impact và metrics', dueAt: at(1, 18) }],
  },
  {
    id: 'app-grab', companyName: 'Grab Việt Nam', jobTitle: 'Product Designer II', status: 'SCREENING',
    location: 'TP. Hồ Chí Minh', source: 'Referral', appliedAt: day(-5),
    createdAt: at(-7), updatedAt: at(-2, 11),
    activities: [
      { id: 'g1', type: 'STATUS_CHANGED', createdAt: at(-2, 11), label: 'Chuyển sang Sàng lọc', detail: 'Từ Đã ứng tuyển' },
      { id: 'g2', type: 'CREATED', createdAt: at(-7), label: 'Đã tạo đơn ứng tuyển' },
    ], appNotes: [], interviews: [],
    tasks: [{ id: 'gt1', title: 'Gửi portfolio bản cập nhật', dueAt: at(-1, 17) }],
  },
  {
    id: 'app-momo', companyName: 'MoMo', jobTitle: 'UX Researcher', status: 'APPLIED',
    location: 'TP. Hồ Chí Minh', source: 'Website công ty', appliedAt: day(-3),
    createdAt: at(-4), updatedAt: at(-3),
    activities: [{ id: 'm1', type: 'CREATED', createdAt: at(-4), label: 'Đã tạo đơn ứng tuyển' }], appNotes: [], interviews: [],
    tasks: [{ id: 'mt1', title: 'Theo dõi phản hồi từ HR', dueAt: at(5, 9) }],
  },
  {
    id: 'app-notion', companyName: 'Notion', jobTitle: 'Product Designer, Growth', status: 'SAVED',
    location: 'Remote', source: 'LinkedIn', deadlineAt: day(9),
    createdAt: at(-2), updatedAt: at(-2),
    activities: [{ id: 'no1', type: 'CREATED', createdAt: at(-2), label: 'Đã tạo đơn ứng tuyển' }], appNotes: [], interviews: [], tasks: [],
  },
  {
    id: 'app-shopify', companyName: 'Shopify', jobTitle: 'Staff UX Designer', status: 'REJECTED',
    location: 'Remote', source: 'Website công ty', appliedAt: day(-31),
    createdAt: at(-35), updatedAt: at(-12),
    activities: [
      { id: 's1', type: 'STATUS_CHANGED', createdAt: at(-12), label: 'Chuyển sang Bị từ chối', detail: 'Từ Phỏng vấn' },
      { id: 's2', type: 'CREATED', createdAt: at(-35), label: 'Đã tạo đơn ứng tuyển' },
    ], appNotes: [], interviews: [], tasks: [],
  },
]
