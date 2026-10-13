import { Flag, ListTodo, UserRound, Video } from 'lucide-react'

const LEGEND = [
  { tone: 'interview', label: 'Phỏng vấn', Icon: Video },
  { tone: 'task', label: 'Việc ứng tuyển', Icon: ListTodo },
  { tone: 'personal', label: 'Việc cá nhân', Icon: UserRound },
  { tone: 'deadline', label: 'Hạn nộp', Icon: Flag },
] as const

/** Static key to the event colours (a tinted swatch with the kind's icon, like the chips), shown in the desktop toolbar. */
export function CalendarLegend() {
  return <ul className="calendar-legend" aria-label="Chú thích màu">
    {LEGEND.map(({ tone, label, Icon }) => <li key={tone} className={`calendar-legend-item ${tone}`}>
      <span className="calendar-legend-swatch" aria-hidden="true"><Icon size={12} strokeWidth={2.25} /></span>
      {label}
    </li>)}
  </ul>
}
