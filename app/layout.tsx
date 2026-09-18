import type { Metadata } from 'next'
import { AppProvider, AppShell } from '../src/App'
import '../src/styles.css'

export const metadata: Metadata = {
  title: 'Trackly — Quản lý ứng tuyển',
  description: 'Quản lý đơn ứng tuyển, lịch phỏng vấn và công việc cần làm.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi">
    <body>
      <AppProvider>
        <AppShell>{children}</AppShell>
      </AppProvider>
    </body>
  </html>
}
