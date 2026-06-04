import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

import { Nav } from '@/components/nav'
import { SettingsProvider } from '@/components/settings-provider'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: '静番茄 · 安静的专注',
  description:
    '为期末考期间准备的、用来对抗焦虑的番茄钟。安静、温柔、随时可以停下来。',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#26302b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className="font-sans antialiased">
        <SettingsProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              <Nav />
              <div className="flex-1">{children}</div>
            </div>
          </ToastProvider>
        </SettingsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
