import { Check } from 'lucide-react'

/** The sticky Save bar: always reachable while scrolling, with an honest unsaved-changes note and the keyboard shortcut. */
export function FormActions({ editing, dirty, onCancel }: { editing: boolean; dirty: boolean; onCancel: () => void }) {
  return <div className="form-actions">
    <p className="form-actions-note">
      {dirty && <span className="form-unsaved"><span aria-hidden="true" />Có thay đổi chưa lưu</span>}
      <span className="form-shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> để lưu</span>
    </p>
    <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
    <button className="primary" type="submit" aria-keyshortcuts="Control+Enter Meta+Enter"><Check size={18} aria-hidden="true" />{editing ? 'Lưu thay đổi' : 'Tạo đơn ứng tuyển'}</button>
  </div>
}
