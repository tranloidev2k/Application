import { Status, STATUS_META } from '../../types'

export function StatusBadge({ status }: { status: Status }) { const meta = STATUS_META[status]; return <span className={`status-badge ${meta.tone}`}>{meta.label}</span> }
