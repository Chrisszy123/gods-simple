'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { EVICTED_NAMES } from '@/lib/eviction'

interface Contestant {
  id: string
  stageName: string
  name: string
  imageUrl: string | null
  totalVotes: number
}

export default function ContestantsPage() {
  const [contestants, setContestants] = useState<Contestant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        const list: Contestant[] = (data.contestants ?? [])
          .sort((a: Contestant, b: Contestant) => a.stageName.localeCompare(b.stageName))
        setContestants(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-[65vh]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(213,66,30,0.38) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(254,191,83,0.07) 0%, transparent 65%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(32px, 6vw, 56px)',
            color: 'var(--gold)',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}>
            THE CONTESTANTS
          </h1>
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.8rem',
            color: 'rgba(254,191,83,0.55)',
            letterSpacing: '0.15em',
          }}>
            Season 1 · All Contestants
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(254,191,83,0.2)', borderTopColor: 'var(--gold)' }} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {contestants.map((contestant, i) => (
            <ContestantCard key={contestant.id} contestant={contestant} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ContestantCard({ contestant, index }: { contestant: Contestant; index: number }) {
  const [hovered, setHovered] = useState(false)

  const name = contestant.stageName.trim().toUpperCase()
  const isEvicted = EVICTED_NAMES.some(n => n.trim().toUpperCase() === name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col overflow-hidden relative"
      style={{
        background: isEvicted ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isEvicted ? 'rgba(255,255,255,0.06)' : hovered ? 'rgba(254,191,83,0.35)' : 'rgba(254,191,83,0.1)'}`,
        borderRadius: 12,
        transform: hovered && !isEvicted ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'border-color 250ms, transform 250ms',
        opacity: isEvicted ? 0.55 : 1,
      }}
    >
      {/* Photo */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: '12px 12px 0 0' }}>
        {contestant.imageUrl ? (
          <Image src={contestant.imageUrl} alt={contestant.stageName} fill className="object-cover" unoptimized
            style={{ filter: isEvicted ? 'grayscale(80%)' : 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(254,191,83,0.06)', fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '3rem', color: 'var(--gold)' }}>
            {contestant.stageName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Evicted banner */}
        {isEvicted && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            <span style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: '1.1rem',
              letterSpacing: '0.18em',
              color: '#ff4444',
              textShadow: '0 0 12px rgba(255,68,68,0.6)',
              transform: 'rotate(-12deg)',
              border: '2px solid rgba(255,68,68,0.7)',
              padding: '4px 10px',
              borderRadius: 4,
            }}>
              EVICTED
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.1rem', color: isEvicted ? 'rgba(255,255,255,0.45)' : '#ffffff', letterSpacing: '0.04em' }}>
          {contestant.stageName}
        </p>
      </div>
    </motion.div>
  )
}
