import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { CalendarView } from './calendarUtils'
import { CalendarLegend } from './CalendarLegend'

/** Period navigation and title, the colour legend, the Tháng/Tuần switch and 'Thêm việc'. */
export function CalendarToolbar({ view, title, showingToday, onToday, onStep, onView, onAdd }: {
  view: CalendarView
  title: string
  /** Today is inside the visible range, so 'Hôm nay' is shown muted. */
  showingToday: boolean
  onToday: () => void
  onStep: (direction: 1 | -1) => void
  onView: (view: CalendarView) => void
  onAdd: () => void
}) {
  const unit = view === 'month' ? 'Tháng' : 'Tuần'
  return <div className="calendar-toolbar"><div className="calendar-toolbar-row">
    <div className="calendar-navigation">
      <button type="button" className={`secondary today-button ${showingToday ? 'is-current' : ''}`} onClick={onToday}>Hôm nay</button>
      <button type="button" className="icon-button" onClick={() => onStep(-1)} aria-label={`${unit} trước`} title={`${unit} trước`}><ChevronLeft size={20} /></button>
      <button type="button" className="icon-button" onClick={() => onStep(1)} aria-label={`${unit} sau`} title={`${unit} sau`}><ChevronRight size={20} /></button>
      <h1 aria-live="polite">{title}</h1>
    </div>
    <CalendarLegend />
    <div className="calendar-toolbar-actions">
      <div className="segmented calendar-view-switch" role="group" aria-label="Kiểu hiển thị">
        <button type="button" aria-pressed={view === 'month'} onClick={() => onView('month')}>Tháng</button>
        <button type="button" aria-pressed={view === 'week'} onClick={() => onView('week')}>Tuần</button>
      </div>
      <button type="button" className="primary" onClick={onAdd}><Plus size={18} aria-hidden="true" /> Thêm việc</button>
    </div>
  </div></div>
}
