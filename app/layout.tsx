import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Gods of the Stage',
  description: 'Real-time voting leaderboard for live talent shows',
  icons: {
    icon: '/images/gods.png',
    apple: '/images/gods.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-white antialiased">
        <NavBar />
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 40,
          background: 'rgba(254,191,83,0.12)', borderBottom: '1px solid rgba(254,191,83,0.3)',
          backdropFilter: 'blur(8px)', padding: '8px 16px', textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
            fontSize: '0.8rem', color: '#FEBF53', letterSpacing: '0.08em',
          }}>
            ⚡ VOTING OPENS IN 10 MINUTES — GET READY!
          </p>
        </div>
        <div style={{ paddingTop: 104 }}>
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
