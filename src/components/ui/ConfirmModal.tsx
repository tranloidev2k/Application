'use client'

import { ReactNode } from 'react'
import { Info, Trash2 } from 'lucide-react'
import { Modal } from './Modal'

/** Confirmation dialog; defaults to the application soft-delete ('Xóa đơn', danger). */
export function ConfirmModal({ title, description, confirmLabel = 'Xóa đơn', tone = 'danger', body, onClose, onConfirm }: {
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'neutral'
  body?: ReactNode
  onClose: () => void
  onConfirm: () => void
}) {
  return <Modal title={title} description={description} onClose={onClose} footer={<><button type="button" className="secondary" onClick={onClose}>Giữ lại</button><button type="button" className={tone === 'danger' ? 'danger-button' : 'primary'} onClick={onConfirm}>{tone === 'danger' && <Trash2 size={17} />}{confirmLabel}</button></>}>
    {body ?? <div className="confirm-warning"><Info size={22} /><p>Bạn có thể hoàn tác ngay sau khi xóa.</p></div>}
  </Modal>
}
