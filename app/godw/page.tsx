'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import PusherClient from 'pusher-js'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'

import CountdownTimer from '@/components/CountdownTimer'
import VoteBadge from '@/components/VoteBadge'
import { filterGodw } from '@/lib/godw'
import { isVotingOpen, VOTING_OPENS_AT, VOTING_CLOSES_AT } from '@/lib/voting-config'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GodwContestant {
  id: string
  stageName: string
  name: string
  imageUrl: string | null
  totalVotes: number
  rank: number
  virtualAccountNumber: string
  virtualAccountBank: string
}

interface VoteBadgeData {
  contestantId: string
  delta: number
  key: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRankStyle(rank: number) {
  if (rank === 1) return { color: 'var(--gold)', fontSize: '2rem', textShadow: '0 0 18px rgba(254,191,83,0.65)' }
  if (rank === 2) return { color: '#C0C0C0', fontSize: '1.5rem' }
  if (rank === 3) return { color: '#CD7F32', fontSize: '1.4rem' }
  return { color: '#ffffff', fontSize: '1rem', opacity: 0.45 }
}

function getAvatarBorder(rank: number) {
  if (rank === 1) return { border: '2px solid var(--gold)', boxShadow: '0 0 14px rgba(254,191,83,0.45)' }
  if (rank === 2) return { border: '2px solid #C0C0C0' }
  if (rank === 3) return { border: '2px solid #CD7F32' }
  return { border: '1px solid rgba(255,255,255,0.1)' }
}

function getBarColor(rank: number): string {
  if (rank === 1) return 'var(--gold)'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return 'rgba(255,255,255,0.3)'
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function copy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={copy}
      style={{
        flexShrink: 0,
        fontFamily: 'Nexa, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: '0.08em',
        color: copied ? '#000' : 'var(--gold)',
        background: copied ? 'var(--gold)' : 'rgba(254,191,83,0.1)',
        border: `1px solid ${copied ? 'var(--gold)' : 'rgba(254,191,83,0.3)'}`,
        borderRadius: 4,
        padding: '3px 8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ COPIED' : 'COPY'}
    </button>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  contestant: GodwContestant
  totalVotes: number
  index: number
  badge?: VoteBadgeData
  votingOpen: boolean
  votingOpensAt?: string
}

function GodwRow({ contestant, totalVotes, index, badge, votingOpen, votingOpensAt }: RowProps) {
  const pct        = totalVotes > 0 ? (contestant.totalVotes / totalVotes) * 100 : 0
  const isFirst    = contestant.rank === 1
  const rankStyle  = getRankStyle(contestant.rank)
  const avatarBorder = getAvatarBorder(contestant.rank)
  const barColor   = getBarColor(contestant.rank)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        layout: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { delay: index * 0.06, duration: 0.3 },
        y: { delay: index * 0.06, duration: 0.3 },
      }}
      className="relative flex items-center gap-3 mb-2 px-4 py-3 rounded-xl"
      style={{
        background: isFirst
          ? 'linear-gradient(135deg, rgba(254,191,83,0.07) 0%, rgba(254,191,83,0.03) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isFirst ? 'rgba(254,191,83,0.22)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {isFirst && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none animate-glow"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(254,191,83,0.12) 0%, transparent 70%)' }}
        />
      )}

      {/* Rank */}
      <div className="flex-shrink-0 w-8 text-center"
        style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', ...rankStyle }}>
        {contestant.rank}
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0 rounded-full overflow-hidden"
        style={{ width: 52, height: 52, ...avatarBorder }}>
        {contestant.imageUrl ? (
          <Image src={contestant.imageUrl} alt={contestant.stageName} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(254,191,83,0.12)', fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.3rem', color: 'var(--gold)' }}>
            {contestant.stageName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <p className="truncate leading-tight mb-1"
          style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.05rem', color: isFirst ? 'var(--gold-light)' : '#ffffff' }}>
          {contestant.stageName}
        </p>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ background: barColor }}
          />
        </div>
      </div>

      {/* Delta badge placeholder */}
      <div className="relative flex-shrink-0 w-6">
        <AnimatePresence>
          {badge && <VoteBadge key={badge.key} delta={badge.delta} />}
        </AnimatePresence>
      </div>

      {/* Account number + copy */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {votingOpen ? (
          <>
            <div className="flex items-center gap-2">
              <span style={{
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 700,
                color: isFirst ? 'var(--gold)' : 'rgba(255,255,255,0.75)',
                letterSpacing: '0.05em',
              }}>
                {contestant.virtualAccountNumber}
              </span>
              <CopyButton text={contestant.virtualAccountNumber} />
            </div>
            <span style={{
              fontFamily: 'Nexa, system-ui, sans-serif',
              fontWeight: 400,
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.06em',
            }}>
              {contestant.virtualAccountBank} · ₦100/vote
            </span>
          </>
        ) : (
          <span style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 10,
            color: 'rgba(254,191,83,0.55)',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}>
            {votingOpensAt
              ? `Voting opens ${new Date(votingOpensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Voting opens soon'}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GodwPage() {
  const [contestants, setContestants] = useState<GodwContestant[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [isExpired, setIsExpired]     = useState(false)
  const [badges, setBadges]           = useState<VoteBadgeData[]>([])

  const badgeKeyRef = useRef(0)

  const totalVotes = contestants.reduce((s, c) => s + c.totalVotes, 0)

  // ── Fetch initial data ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setError(null)
    fetch('/api/leaderboard')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`)
        // Alphabetical only before voting has ever started; show vote order during AND after
        const preVoting = new Date() < new Date(VOTING_OPENS_AT)
        const filtered = filterGodw<GodwContestant>(data.contestants ?? [])
          .sort((a, b) => preVoting
            ? a.stageName.localeCompare(b.stageName)
            : b.totalVotes - a.totalVotes)
          .map((c, i) => ({ ...c, rank: i + 1 }))
        setContestants(filtered)
        setLoading(false)
      })
      .catch((err: Error) => { setError(err.message || 'Failed to load.'); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Pusher real-time updates ──────────────────────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return

    const pusher  = new PusherClient(key, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu' })
    const channel = pusher.subscribe('leaderboard')

    channel.bind('VOTE_UPDATE', ({ contestantId, newTotalVotes, delta }: { contestantId: string; newTotalVotes: number; delta: number }) => {
      setContestants(prev => {
        const updated = prev.map(c => c.id === contestantId ? { ...c, totalVotes: newTotalVotes } : c)
        const preVoting = new Date() < new Date(VOTING_OPENS_AT)
        return updated
          .sort((a, b) => preVoting ? a.stageName.localeCompare(b.stageName) : b.totalVotes - a.totalVotes)
          .map((c, i) => ({ ...c, rank: i + 1 }))
      })

      badgeKeyRef.current += 1
      const k = badgeKeyRef.current
      setBadges(prev => [...prev, { contestantId, delta, key: k }])
      setTimeout(() => setBadges(prev => prev.filter(b => b.key !== k)), 2000)
    })

    return () => { channel.unbind_all(); pusher.unsubscribe('leaderboard'); pusher.disconnect() }
  }, [])


  const handleExpire = useCallback(() => {
    setIsExpired(true)
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ['#FEBF53', '#FFD97A', '#ffffff', '#D5421E'] })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
    }, 300)
  }, [])

  const winner = isExpired && contestants.length > 0 ? contestants[0] : null

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-[65vh]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(213,66,30,0.38) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(254,191,83,0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-x-0 top-0 h-32"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-2xl mx-auto w-full px-4">

        {/* Header */}
        <header className="flex flex-col items-center pt-8 pb-5">
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center"
            style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: 'clamp(36px, 8vw, 64px)',
              color: '#ffffff',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              marginBottom: 8,
            }}
          >
            GOD OF THE WEEK
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: 'Nexa, system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '0.75rem',
              color: 'rgba(254,191,83,0.6)',
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}
          >
            Transfer ₦100 to vote · Wema Bank
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>

          <div className="mt-5 w-full"
            style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.2) 30%, rgba(254,191,83,0.2) 70%, transparent 100%)' }} />
        </header>

        {/* Leaderboard */}
        <main className="flex-1 overflow-y-auto leaderboard-scroll py-3">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-9 h-9 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(254,191,83,0.2)', borderTopColor: 'var(--gold)' }} />
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.8rem', color: 'var(--gold)', opacity: 0.45, letterSpacing: '0.1em' }}>
                Loading…
              </p>
            </div>
          )}

          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6">
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--orange-red)', lineHeight: 1.6 }}>
                {error}
              </p>
              <button onClick={fetchData}
                style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--black)', background: 'var(--gold)', padding: '10px 28px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                Try Again
              </button>
            </motion.div>
          )}

          {!loading && !error && contestants.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem', color: 'var(--gold)', opacity: 0.35, letterSpacing: '0.08em' }}>
                No contestants yet
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {contestants.map((c, i) => (
              <GodwRow
                key={c.id}
                contestant={c}
                totalVotes={totalVotes}
                index={i}
                badge={badges.find(b => b.contestantId === c.id)}
                votingOpen={isVotingOpen()}
                votingOpensAt={VOTING_OPENS_AT}
              />
            ))}
          </AnimatePresence>
        </main>

        <footer className="flex flex-col items-center py-5 gap-1.5">
          <div className="mb-3 w-full"
            style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.12) 30%, rgba(254,191,83,0.12) 70%, transparent 100%)' }} />
          <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.28 }}>
            Gods of the Stage
          </p>
          <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
            ₦100 per vote · Wema Bank transfer
          </p>
        </footer>
      </div>

      {/* Winner banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-md"
            style={{
              borderTop: '1px solid rgba(254,191,83,0.4)',
              background: 'linear-gradient(to top, rgba(254,191,83,0.14) 0%, rgba(254,191,83,0.06) 60%, transparent 100%)',
            }}
          >
            <div className="max-w-2xl mx-auto px-6 py-6 text-center">
              <motion.p
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.15 }}
                style={{
                  fontFamily: 'CogsAndBolts, Impact, sans-serif',
                  fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                  letterSpacing: '0.05em',
                  color: 'var(--gold)',
                  textShadow: '0 0 24px rgba(254,191,83,0.5)',
                }}
              >
                👑 GOD OF THE WEEK — {winner.stageName}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
