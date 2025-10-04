import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/Toaster'
import { NoSSR } from '@/components/NoSSR'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NX Reporting - PDF Data Extraction & Analytics',
  description: 'Upload PDFs, extract structured data, and generate powerful analytics reports',
  keywords: ['PDF', 'extraction', 'analytics', 'reporting', 'data'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <NoSSR fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </div>
            <Toaster />
          </AuthProvider>
        </NoSSR>
      </body>
    </html>
  )
}