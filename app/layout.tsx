import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Have a Good Time Merging! | Document Merger',
  description: 'Merge PDFs, images, and documents into one file. 100% free, private, and runs entirely in your browser. No uploads needed!',
  keywords: ['pdf merger', 'combine pdf', 'merge documents', 'image to pdf', 'free pdf tool'],
  authors: [{ name: 'Document Merger Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Doc Merger',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Have a Good Time Merging! | Document Merger',
    description: 'Merge PDFs, images, and documents into one file. 100% free and private.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

