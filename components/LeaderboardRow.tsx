'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import VoteBadge from './VoteBadge'

export interface ContestantRow {
  id: string
  stageName: string
  name: string
  imageUrl: string | null
  totalVotes: number
  rank: number
}

interface VoteBadgeData {
  contestantId: string
  delta: number
  key: number
}

interface Props {
  contestant: ContestantRow
  totalVotes: number
  index: number
  voteBadge?: VoteBadgeData
}

interface RankStyle {
  color: string
  fontSize: string
  textShadow?: string
  opacity?: number
}

function getRankStyle(rank: number): RankStyle {
  if (rank === 1) return {
    color: 'var(--gold)',
    fontSize: '2rem',
    textShadow: '0 0 18px rgba(254,191,83,0.65), 0 0 40px rgba(254,191,83,0.25)',
  }
  if (rank === 2) return { color: '#C0C0C0', fontSize: '1.5rem' }
  if (rank === 3) return { color: '#CD7F32', fontSize: '1.4rem' }
  return { color: '#ffffff', fontSize: '1rem', opacity: 0.45 }
}

interface AvatarBorder {
  border: string
  boxShadow?: string
}

function getAvatarBorder(rank: number): AvatarBorder {
  if (rank === 1) return {
    border: '2px solid var(--gold)',
    boxShadow: '0 0 14px rgba(254,191,83,0.45), 0 0 28px rgba(254,191,83,0.15)',
  }
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

export default function LeaderboardRow({ contestant, totalVotes, index, voteBadge }: Props) {
  const pct = totalVotes > 0 ? (contestant.totalVotes / totalVotes) * 100 : 0
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
        opacity: { delay: index * 0.07, duration: 0.3 },
        y: { delay: index * 0.07, duration: 0.3 },
      }}
      className="relative flex items-center gap-3 mb-2 px-4 py-3 rounded-xl"
      style={{
        background: isFirst
          ? 'linear-gradient(135deg, rgba(254,191,83,0.07) 0%, rgba(254,191,83,0.03) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isFirst ? 'rgba(254,191,83,0.22)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Rank #1 edge glow */}
      {isFirst && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none animate-glow"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(254,191,83,0.12) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Rank number */}
      <div
        className="flex-shrink-0 w-8 text-center"
        style={{
          fontFamily: 'CogsAndBolts, Impact, sans-serif',
          ...rankStyle,
        }}
      >
        {contestant.rank}
      </div>

      {/* Avatar */}
      <div
        className="relative flex-shrink-0 rounded-full overflow-hidden"
        style={{ width: 52, height: 52, ...avatarBorder }}
      >
        {contestant.imageUrl ? (
          <Image
            src={contestant.imageUrl}
            alt={contestant.stageName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'rgba(254,191,83,0.12)',
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: '1.3rem',
              color: 'var(--gold)',
            }}
          >
            {contestant.stageName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + vote bar */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate leading-tight mb-2"
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: '1.05rem',
            color: isFirst ? 'var(--gold-light)' : '#ffffff',
            textShadow: isFirst ? '0 0 12px rgba(254,191,83,0.3)' : 'none',
          }}
        >
          {contestant.stageName}
        </p>
        {/* Vote bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ background: barColor }}
          />
        </div>
      </div>

      {/* Vote count */}
      <div className="relative flex-shrink-0 text-right pl-2">
        <div>
          <span
            style={{
              fontFamily: 'Nexa, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: isFirst ? 'var(--gold)' : 'rgba(255,255,255,0.65)',
            }}
          >
            {contestant.totalVotes.toLocaleString()}
          </span>
          <span
            style={{
              fontFamily: 'Nexa, system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.25)',
              marginLeft: 3,
            }}
          >
            votes
          </span>
        </div>
        <AnimatePresence>
          {voteBadge && <VoteBadge key={voteBadge.key} delta={voteBadge.delta} />}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
