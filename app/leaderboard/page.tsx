'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import EvictionChart, { type ChartContestant } from '@/components/EvictionChart'
import CountdownTimer from '@/components/CountdownTimer'
import { filterEviction } from '@/lib/eviction'
import { isVotingOpen, VOTING_OPENS_AT, VOTING_CLOSES_AT } from '@/lib/voting-config'

export default function LeaderboardPage() {
  const [contestants, setContestants] = useState<ChartContestant[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const handleExpire = useCallback(() => {}, [])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`)
        setContestants(filterEviction(data.contestants ?? []))
      })
      .catch((err: Error) => setError(err.message || 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-x-0 bottom-0 h-[65vh]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(213,66,30,0.28) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(254,191,83,0.05) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: 10,
          }}>
            Leaderboard
          </p>
          <h1 style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            color: '#ffffff',
            letterSpacing: '0.08em',
            lineHeight: 1.05,
            marginBottom: 8,
          }}>
            THE EVICTION SHOW
          </h1>
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}>
            Top 2 are safe · Everyone else is at risk
          </p>
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'rgba(254,191,83,0.55)',
            letterSpacing: '0.06em',
            marginBottom: 20,
          }}>
            Vote for your contestant to move them into the SAFE Zone and keep them in the competition
          </p>

          <div className="flex justify-center">
            {new Date() < new Date(VOTING_OPENS_AT) ? (
              <p style={{
                fontFamily: 'Nexa, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'rgba(254,191,83,0.55)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                Voting opens {new Date(VOTING_OPENS_AT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <CountdownTimer endsAt={VOTING_CLOSES_AT} onExpire={handleExpire} />
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-9 h-9 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(254,191,83,0.2)', borderTopColor: '#FEBF53' }}
            />
            <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.8rem', color: 'rgba(254,191,83,0.45)', letterSpacing: '0.1em' }}>
              Loading…
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-5 text-center"
          >
            <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#D5421E' }}>
              {error}
            </p>
            <button
              onClick={() => { setError(null); setLoading(true); fetch('/api/leaderboard').then(r => r.json()).then(d => { setContestants(filterEviction(d.contestants ?? [])); setLoading(false) }).catch(() => { setError('Failed to load.'); setLoading(false) }) }}
              style={{
                fontFamily: 'Nexa, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#000',
                background: '#FEBF53',
                padding: '10px 28px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Chart */}
        {!loading && !error && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <EvictionChart contestants={contestants} votingOpen={isVotingOpen()} votingOpensAt={VOTING_OPENS_AT} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
