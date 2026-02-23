import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Owed — Get paid. Without the awkward emails.',
  description: 'Owed connects to Xero and sends professional, relationship-safe follow-ups until your invoice is paid. You do nothing. The money arrives.',
  metadataBase: new URL('https://owedhq.com'),
  openGraph: {
    title: 'Owed — Get paid. Without the awkward emails.',
    description: 'Invoice chasing on autopilot. Connect Xero, and Owed sends professional follow-ups in your name until you\'re paid.',
    url: 'https://owedhq.com',
    siteName: 'Owed',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Owed — Get paid. Without the awkward emails.',
    description: 'Invoice chasing on autopilot for UK freelancers and small businesses.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
