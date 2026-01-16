import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Document Merger | Combine PDFs & Images',
  description: 'Merge PDFs and images into a single document. Drop folders, drag files, and download your merged PDF instantly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

