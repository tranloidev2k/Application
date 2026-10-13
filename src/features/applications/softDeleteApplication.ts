import type { ToastFn, UpdateApplicationFn } from '../../context/AppDataContext'

/** Soft-deletes an application (the caller has already confirmed) and offers an undo that clears deletedAt again. */
export function softDeleteApplication(id: string, updateApplication: UpdateApplicationFn, toast: ToastFn) {
  const now = new Date().toISOString()
  updateApplication(id, application => ({ ...application, deletedAt: now, updatedAt: now }))
  toast('Đã xóa đơn ứng tuyển', {
    actionLabel: 'Hoàn tác',
    onAction: () => {
      updateApplication(id, application => ({ ...application, deletedAt: undefined, updatedAt: new Date().toISOString() }))
      toast('Đã khôi phục đơn ứng tuyển')
    },
  })
}
