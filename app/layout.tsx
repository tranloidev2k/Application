import type { Metadata, Viewport } from 'next'
import { AppShell } from '../src/components/layout/AppShell'
import { AppProvider } from '../src/context/AppDataContext'
import '../src/styles/tokens.css'
import '../src/styles/base.css'
import '../src/styles/layout.css'
import '../src/styles/components.css'
import '../src/styles/dashboard.css'
import '../src/styles/applications.css'
import '../src/styles/board.css'
import '../src/styles/form.css'
import '../src/styles/detail.css'
import '../src/styles/calendar.css'
import '../src/styles/event-colors.css'
import '../src/styles/duplicate-event.css'
import '../src/styles/account.css'
import '../src/styles/taste.css'
import '../src/styles/motion.css'

export const metadata: Metadata = {
  title: 'Trackly — Quản lý ứng tuyển',
  description: 'Quản lý đơn ứng tuyển, lịch phỏng vấn và công việc cần làm.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6f7f8',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif&display=swap&subset=latin,latin-ext,vietnamese" rel="stylesheet" />
    </head>
    <body>
      <AppProvider>
        <AppShell>{children}</AppShell>
      </AppProvider>
    </body>
  </html>
}
