'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import PusherClient from 'pusher-js'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'

import LeaderboardRow, { type ContestantRow } from '@/components/LeaderboardRow'
import CountdownTimer from '@/components/CountdownTimer'
import WinnerBanner from '@/components/WinnerBanner'

interface VotingRound {
  id: string
  name: string
  endsAt: string
  isActive: boolean
  winnerId: string | null
}

interface VoteBadge {
  contestantId: string
  delta: number
  key: number
}

export default function Home() {
  const [contestants, setContestants] = useState<ContestantRow[]>([])
  const [round, setRound]             = useState<VotingRound | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [isExpired, setIsExpired]     = useState(false)
  const [badges, setBadges]           = useState<VoteBadge[]>([])

  const badgeKeyRef = useRef(0)

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Show a floating +N badge then remove it after 2 s */
  const showBadge = useCallback((contestantId: string, delta: number) => {
    badgeKeyRef.current += 1
    const key = badgeKeyRef.current
    setBadges((prev) => [...prev, { contestantId, delta, key }])
    setTimeout(() => setBadges((prev) => prev.filter((b) => b.key !== key)), 2000)
  }, [])

  /** Apply a VOTE_UPDATE payload to the contestants list */
  const applyVoteUpdate = useCallback(
    (contestantId: string, newTotalVotes: number, delta: number) => {
      setContestants((prev) => {
        const updated = prev.map((c) =>
          c.id === contestantId ? { ...c, totalVotes: newTotalVotes } : c
        )
        return updated
          .sort((a, b) => b.totalVotes - a.totalVotes)
          .map((c, i) => ({ ...c, rank: i + 1 }))
      })
      showBadge(contestantId, delta)
    },
    [showBadge]
  )

  // ── Initial data load ────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(() => {
    setLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      setLoading(false)
      setError('Request timed out. Check your server and try again.')
    }, 4000)

    fetch('/api/leaderboard')
      .then(async (res) => {
        clearTimeout(timer)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`)
        setContestants(data.contestants ?? [])
        setRound(data.round ?? null)
        setLoading(false)
      })
      .catch((err: Error) => {
        clearTimeout(timer)
        setError(err.message || 'Failed to load.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // ── Pusher — real-time vote updates ─────────────────────────────────────

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return

    const pusher = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    })

    const channel = pusher.subscribe('leaderboard')

    channel.bind(
      'VOTE_UPDATE',
      ({ contestantId, newTotalVotes, delta }: {
        contestantId: string
        newTotalVotes: number
        delta: number
      }) => {
        applyVoteUpdate(contestantId, newTotalVotes, delta)
      }
    )

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('leaderboard')
      pusher.disconnect()
    }
  }, [applyVoteUpdate])

  // ── Silent background poll — safety net for missed events ───────────────
  // Silently re-syncs the full leaderboard every 10 s in case a Pusher event
  // was dropped (disconnection, network blip, etc.)

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/leaderboard')
        if (!res.ok) return
        const data = await res.json()
        // Only update state — no loading/error toggle, no badges
        setContestants(data.contestants ?? [])
        setRound(data.round ?? null)
      } catch { /* silent */ }
    }, 10_000)

    return () => clearInterval(id)
  }, [])

  // ── Voting round expiry ───────────────────────────────────────────────────

  const handleExpire = useCallback(() => {
    setIsExpired(true)
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ['#FEBF53', '#FFD97A', '#ffffff', '#D5421E'] })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
    }, 300)
  }, [])

  const winner     = isExpired && contestants.length > 0 ? contestants[0] : null
  const totalVotes = contestants.reduce((sum, c) => sum + c.totalVotes, 0)

  // ── Render ────────────────────────────────────────────────────────────────

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

      <div className="relative z-10 flex flex-col min-h-screen max-w-xl mx-auto w-full px-4">

        {/* ── Zone 1: Header ──────────────────────────────────────────── */}
        <header className="flex flex-col items-center pt-8 pb-5">

          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
            className="relative mb-3" style={{ height: 90, width: '100%', maxWidth: 260 }}
          >
            <Image
              src="/images/gods.png" alt="Gods of the Stage" fill className="object-contain" priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7, marginBottom: 20 }}
          >
            Vote Now
          </motion.p>

          {round && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <CountdownTimer endsAt={round.endsAt} onExpire={handleExpire} />
            </motion.div>
          )}

          {round && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 0.45 }}
              style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: 14 }}
            >
              {round.name}
            </motion.p>
          )}

          <div className="mt-5 w-full"
            style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.2) 30%, rgba(254,191,83,0.2) 70%, transparent 100%)' }} />
        </header>

        {/* ── Zone 2: Leaderboard ─────────────────────────────────────── */}
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
              className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6"
            >
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--orange-red)', lineHeight: 1.6 }}>
                {error}
              </p>
              <button onClick={fetchLeaderboard} className="transition-all active:scale-95"
                style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--black)', background: 'var(--gold)', padding: '10px 28px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {!loading && !error && contestants.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-2 text-center"
            >
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem', color: 'var(--gold)', opacity: 0.35, letterSpacing: '0.08em' }}>
                No contestants yet
              </p>
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                Check back when the show begins
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {contestants.map((contestant, index) => (
              <LeaderboardRow
                key={contestant.id}
                contestant={contestant}
                totalVotes={totalVotes}
                index={index}
                voteBadge={badges.find((b) => b.contestantId === contestant.id)}
              />
            ))}
          </AnimatePresence>
        </main>

        {/* ── Zone 3: Footer ──────────────────────────────────────────── */}
        <footer className="flex flex-col items-center py-5 gap-1.5">
          <div className="mb-3 w-full"
            style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.12) 30%, rgba(254,191,83,0.12) 70%, transparent 100%)' }} />
          <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.28 }}>
            Gods of the Stage
          </p>
          <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
            Powered by Paystack
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {winner && <WinnerBanner key="winner" stageName={winner.stageName} />}
      </AnimatePresence>
    </div>
  )
}
