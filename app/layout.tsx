import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import VotingCountdownBanner from '@/components/VotingCountdownBanner'
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
        <VotingCountdownBanner />
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
