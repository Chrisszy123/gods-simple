'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import PusherClient from 'pusher-js'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import CountdownTimer from '@/components/CountdownTimer'
import WinnerBanner from '@/components/WinnerBanner'
import VoteBadge from '@/components/VoteBadge'
import { getBrowserFingerprint } from '@/lib/fingerprint'

interface GodwContestant {
  id: string
  stageName: string
  name: string
  imageUrl: string | null
  totalVotes: number
  godwVoteCount: number
  rank: number
  virtualAccountNumber: string
  virtualAccountBank: string
}

interface GodwRound {
  id: string
  name: string
  startsAt: string
  endsAt: string
  isActive: boolean
  winnerId: string | null
}

interface VoteBadgeData {
  contestantId: string
  delta: number
  key: number
}

type VoteState = 'idle' | 'loading' | 'voted-this' | 'voted-other' | 'round-ended'

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

interface VoteButtonProps {
  contestantId: string
  state: VoteState
  onVote: (contestantId: string) => void
}

function VoteButton({ contestantId, state, onVote }: VoteButtonProps) {
  const [hovered, setHovered] = useState(false)

  if (state === 'round-ended') return null

  if (state === 'loading') {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 72, height: 32 }}
      >
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(254,191,83,0.2)', borderTopColor: 'var(--gold)' }}
        />
      </div>
    )
  }

  if (state === 'voted-this') {
    return (
      <motion.button
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        disabled
        className="flex-shrink-0"
        style={{
          fontFamily: 'CogsAndBolts, Impact, sans-serif',
          fontSize: 12,
          letterSpacing: '0.08em',
          color: '#000',
          background: 'var(--gold)',
          border: '1px solid var(--gold)',
          borderRadius: 6,
          height: 32,
          width: 72,
          cursor: 'default',
        }}
      >
        ✓ VOTED
      </motion.button>
    )
  }

  if (state === 'voted-other') {
    return (
      <div className="relative group flex-shrink-0">
        <button
          disabled
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.3)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            height: 32,
            width: 72,
            cursor: 'default',
          }}
        >
          VOTED
        </button>
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap z-10 px-2 py-1 rounded text-xs"
          style={{
            background: '#161616',
            border: '1px solid rgba(254,191,83,0.2)',
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          You&apos;ve already used your vote this round
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => onVote(contestantId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 transition-all duration-200 active:scale-95"
      style={{
        fontFamily: 'CogsAndBolts, Impact, sans-serif',
        fontSize: 14,
        letterSpacing: '0.08em',
        color: hovered ? '#000' : 'var(--gold)',
        background: hovered ? 'var(--gold)' : 'transparent',
        border: '1px solid var(--gold)',
        borderRadius: 6,
        height: 32,
        width: 72,
        cursor: 'pointer',
      }}
    >
      VOTE
    </button>
  )
}

interface GodwRowProps {
  contestant: GodwContestant
  totalGodwVotes: number
  index: number
  voteState: VoteState
  onVote: (contestantId: string) => void
  voteBadge?: VoteBadgeData
}

function GodwRow({ contestant, totalGodwVotes, index, voteState, onVote, voteBadge }: GodwRowProps) {
  const pct = totalGodwVotes > 0 ? (contestant.godwVoteCount / totalGodwVotes) * 100 : 0
  const isFirst = contestant.rank === 1
  const rankStyle = getRankStyle(contestant.rank)
  const avatarBorder = getAvatarBorder(contestant.rank)
  const barColor = getBarColor(contestant.rank)

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

      <div className="flex-shrink-0 w-8 text-center" style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', ...rankStyle }}>
        {contestant.rank}
      </div>

      <div className="relative flex-shrink-0 rounded-full overflow-hidden" style={{ width: 52, height: 52, ...avatarBorder }}>
        {contestant.imageUrl ? (
          <Image src={contestant.imageUrl} alt={contestant.stageName} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(254,191,83,0.12)', fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.3rem', color: 'var(--gold)' }}>
            {contestant.stageName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate leading-tight mb-1"
          style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.05rem', color: isFirst ? 'var(--gold-light)' : '#ffffff' }}>
          {contestant.stageName}
        </p>
        <div className="w-full rounded-full overflow-hidden mb-1" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ background: barColor }}
          />
        </div>
        <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
          💰 {contestant.totalVotes.toLocaleString()} paid votes
        </p>
      </div>

      <div className="relative flex-shrink-0 text-right pl-2">
        <div>
          <span style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: isFirst ? 'var(--gold)' : 'rgba(255,255,255,0.65)' }}>
            {contestant.godwVoteCount.toLocaleString()}
          </span>
          <span style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginLeft: 3 }}>
            GODW
          </span>
        </div>
        <AnimatePresence>
          {voteBadge && <VoteBadge key={voteBadge.key} delta={voteBadge.delta} />}
        </AnimatePresence>
      </div>

      <VoteButton contestantId={contestant.id} state={voteState} onVote={onVote} />
    </motion.div>
  )
}

export default function GodwPage() {
  const [contestants, setContestants] = useState<GodwContestant[]>([])
  const [round, setRound] = useState<GodwRound | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [badges, setBadges] = useState<VoteBadgeData[]>([])
  const [votingId, setVotingId] = useState<string | null>(null)
  const [myVotedId, setMyVotedId] = useState<string | null>(null)
  const [hasVotedInRound, setHasVotedInRound] = useState(false)

  const badgeKeyRef = useRef(0)
  const fingerprintRef = useRef<string | null>(null)

  const getFingerprint = useCallback(async () => {
    if (!fingerprintRef.current) {
      fingerprintRef.current = await getBrowserFingerprint()
    }
    return fingerprintRef.current
  }, [])

  const showBadge = useCallback((contestantId: string, delta: number) => {
    badgeKeyRef.current += 1
    const key = badgeKeyRef.current
    setBadges((prev) => [...prev, { contestantId, delta, key }])
    setTimeout(() => setBadges((prev) => prev.filter((b) => b.key !== key)), 2000)
  }, [])

  const applyGodwUpdate = useCallback((contestantId: string, newGodwVotes: number) => {
    setContestants((prev) => {
      const updated = prev.map((c) =>
        c.id === contestantId ? { ...c, godwVoteCount: newGodwVotes } : c
      )
      return updated.sort((a, b) => b.godwVoteCount - a.godwVoteCount).map((c, i) => ({ ...c, rank: i + 1 }))
    })
    showBadge(contestantId, 1)
  }, [showBadge])

  const fetchLeaderboard = useCallback(() => {
    setLoading(true)
    setError(null)

    fetch('/api/godw/leaderboard')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`)
        setContestants(data.contestants ?? [])
        setRound(data.round ?? null)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load.')
        setLoading(false)
      })
  }, [])

  const fetchMyVote = useCallback(() => {
    getFingerprint().then((fp) => {
      const url = fp ? `/api/godw/my-vote?fp=${fp}` : '/api/godw/my-vote'
      return fetch(url)
    }).then((res) => res.json())
      .then((data) => {
        if (data.hasVoted) {
          setHasVotedInRound(true)
          // Check localStorage for the specific contestant
          const stored = localStorage.getItem('godw_voted_id')
          if (stored) setMyVotedId(stored)
          else if (data.votedForContestantId) setMyVotedId(data.votedForContestantId)
        }
      })
      .catch(() => {/* silent */})
  }, [])

  useEffect(() => {
    fetchLeaderboard()
    fetchMyVote()

    // Restore localStorage hint
    const stored = localStorage.getItem('godw_voted_id')
    if (stored) {
      setMyVotedId(stored)
      setHasVotedInRound(true)
    }
  }, [fetchLeaderboard, fetchMyVote])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return

    const pusher = new PusherClient(key, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1' })
    const channel = pusher.subscribe('godw-leaderboard')

    channel.bind('GODW_VOTE_UPDATE', ({ contestantId, newGodwVotes }: { contestantId: string; newGodwVotes: number }) => {
      applyGodwUpdate(contestantId, newGodwVotes)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('godw-leaderboard')
      pusher.disconnect()
    }
  }, [applyGodwUpdate])

  // Background poll safety net
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/godw/leaderboard')
        if (!res.ok) return
        const data = await res.json()
        setContestants(data.contestants ?? [])
        setRound(data.round ?? null)
      } catch { /* silent */ }
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  const handleVote = useCallback(async (contestantId: string) => {
    setVotingId(contestantId)
    try {
      const fingerprint = await getFingerprint()
      const res = await fetch('/api/godw/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestantId, fingerprint }),
      })
      const data = await res.json()

      if (res.ok) {
        setMyVotedId(contestantId)
        setHasVotedInRound(true)
        localStorage.setItem('godw_voted_id', contestantId)
        toast.success('Vote cast! Thank you.', {
          style: {
            background: '#161616',
            border: '1px solid rgba(254,191,83,0.2)',
            borderLeft: '3px solid var(--gold)',
            color: '#fff',
          },
        })
        // Update local state optimistically
        setContestants((prev) => {
          const updated = prev.map((c) =>
            c.id === contestantId ? { ...c, godwVoteCount: data.newVoteCount ?? c.godwVoteCount + 1 } : c
          )
          return updated.sort((a, b) => b.godwVoteCount - a.godwVoteCount).map((c, i) => ({ ...c, rank: i + 1 }))
        })
        showBadge(contestantId, 1)
      } else if (data.error === 'already_voted') {
        toast.error('You already voted for this contestant', {
          style: {
            background: '#161616',
            border: '1px solid rgba(213,66,30,0.3)',
            borderLeft: '3px solid var(--orange-red)',
            color: '#fff',
          },
        })
      } else if (data.error === 'round_vote_used') {
        setHasVotedInRound(true)
        toast.error("You've already used your free vote this round", {
          style: {
            background: '#161616',
            border: '1px solid rgba(213,66,30,0.3)',
            borderLeft: '3px solid var(--orange-red)',
            color: '#fff',
          },
        })
      } else {
        throw new Error(data.message)
      }
    } catch {
      toast.error('Something went wrong, try again', {
        style: {
          background: '#161616',
          border: '1px solid rgba(213,66,30,0.3)',
          borderLeft: '3px solid var(--orange-red)',
          color: '#fff',
        },
      })
    } finally {
      setVotingId(null)
    }
  }, [showBadge, getFingerprint])

  const handleExpire = useCallback(() => {
    setIsExpired(true)
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ['#FEBF53', '#FFD97A', '#ffffff', '#D5421E'] })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#FEBF53', '#FFD97A', '#ffffff'] })
    }, 300)
  }, [])

  function getVoteState(contestantId: string): VoteState {
    if (isExpired) return 'round-ended'
    if (votingId === contestantId) return 'loading'
    if (myVotedId === contestantId) return 'voted-this'
    if (hasVotedInRound) return 'voted-other'
    return 'idle'
  }

  const winner = isExpired && contestants.length > 0 ? contestants[0] : null
  const totalGodwVotes = contestants.reduce((sum, c) => sum + c.godwVoteCount, 0)

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
            Free to vote · One vote per person per round
          </motion.p>

          {round && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-4"
              style={{
                fontFamily: 'Nexa, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: 'var(--gold)',
                background: 'rgba(254,191,83,0.1)',
                border: '1px solid rgba(254,191,83,0.3)',
                borderRadius: 9999,
                padding: '4px 16px',
                letterSpacing: '0.08em',
              }}
            >
              {round.name}
            </motion.div>
          )}

          {round && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <CountdownTimer endsAt={round.endsAt} onExpire={handleExpire} />
            </motion.div>
          )}

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
              className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6"
            >
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--orange-red)', lineHeight: 1.6 }}>
                {error}
              </p>
              <button onClick={fetchLeaderboard}
                style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--black)', background: 'var(--gold)', padding: '10px 28px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
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
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {contestants.map((contestant, index) => (
              <GodwRow
                key={contestant.id}
                contestant={contestant}
                totalGodwVotes={totalGodwVotes}
                index={index}
                voteState={getVoteState(contestant.id)}
                onVote={handleVote}
                voteBadge={badges.find((b) => b.contestantId === contestant.id)}
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
            Free vote · One per round per person
          </p>
        </footer>
      </div>

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
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontFamily: 'Nexa, system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: '0.75rem',
                  color: 'rgba(254,191,83,0.5)',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                Voting has closed
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
