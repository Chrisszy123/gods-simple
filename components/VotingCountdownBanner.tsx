'use client'

import { useEffect, useState } from 'react'
import { VOTING_OPENS_AT, VOTING_CLOSES_AT } from '@/lib/voting-config'

function getSecondsUntil(target: string) {
  return Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000))
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export default function VotingCountdownBanner() {
  const [secondsToOpen,  setSecondsToOpen]  = useState(() => getSecondsUntil(VOTING_OPENS_AT))
  const [secondsToClose, setSecondsToClose] = useState(() => getSecondsUntil(VOTING_CLOSES_AT))

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsToOpen(getSecondsUntil(VOTING_OPENS_AT))
      setSecondsToClose(getSecondsUntil(VOTING_CLOSES_AT))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // voting has closed
  if (secondsToClose === 0) return null

  // voting is open
  if (secondsToOpen === 0) {
    return (
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 40,
        background: 'rgba(213,66,30,0.15)', borderBottom: '1px solid rgba(213,66,30,0.4)',
        backdropFilter: 'blur(8px)', padding: '8px 16px', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
          fontSize: '0.8rem', color: '#D5421E', letterSpacing: '0.08em',
        }}>
          🔴 VOTING IS OPEN — closes in {fmt(secondsToClose)}
        </p>
      </div>
    )
  }

  // voting hasn't opened yet
  return (
    <div style={{
      position: 'fixed', top: 64, left: 0, right: 0, zIndex: 40,
      background: 'rgba(254,191,83,0.12)', borderBottom: '1px solid rgba(254,191,83,0.3)',
      backdropFilter: 'blur(8px)', padding: '8px 16px', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
        fontSize: '0.8rem', color: '#FEBF53', letterSpacing: '0.08em',
      }}>
        ⚡ VOTING OPENS IN {fmt(secondsToOpen)} — GET READY!
      </p>
    </div>
  )
}
