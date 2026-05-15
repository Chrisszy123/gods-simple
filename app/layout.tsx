import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Gods of the Stage',
  description: 'Real-time voting leaderboard for live talent shows',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-white antialiased">
        <NavBar />
        <div style={{ paddingTop: 64 }}>
          {children}
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#161616',
              border: '1px solid rgba(254,191,83,0.2)',
              color: '#ffffff',
              fontFamily: 'Nexa, system-ui, sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
