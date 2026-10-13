'use client'

import Link from 'next/link'
import { Bookmark, BriefcaseBusiness, CalendarClock, Plus, RefreshCw } from 'lucide-react'

const STEPS = [
  { icon: Bookmark, label: 'Lưu tin tuyển dụng bạn quan tâm' },
  { icon: RefreshCw, label: 'Cập nhật trạng thái khi có tiến triển' },
  { icon: CalendarClock, label: 'Lên lịch phỏng vấn & việc cần làm' },
]

/** First run (no applications yet): what the list is for and one way in, instead of an empty table and filters. */
export function OnboardingEmpty() {
  return <section className="table-panel empty-state onboarding" aria-labelledby="applications-onboarding-title">
    <span aria-hidden="true"><BriefcaseBusiness size={24} /></span>
    <h2 id="applications-onboarding-title">Bắt đầu theo dõi hành trình ứng tuyển</h2>
    <p>Gom mọi cơ hội về một nơi để luôn biết đơn nào đang ở bước nào và việc gì cần làm tiếp.</p>
    <Link className="primary" href="/applications/new"><Plus size={18} aria-hidden="true" /> Thêm đơn đầu tiên</Link>
    <ol className="onboarding-steps">
      {STEPS.map(step => <li key={step.label}>
        <span className="onboarding-step-icon" aria-hidden="true"><step.icon size={18} /></span>
        <span>{step.label}</span>
      </li>)}
    </ol>
  </section>
}
