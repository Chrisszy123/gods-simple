'use client'

import { motion } from 'framer-motion'

export default function LeaderboardPage() {
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: 16,
          }}>
            Season 1
          </p>

          <h1 style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            color: '#ffffff',
            letterSpacing: '0.08em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}>
            SEASON CLOSED
          </h1>

          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'rgba(254,191,83,0.6)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            🏆 This season has officially closed
          </p>

          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.06em',
          }}>
            Nobody is up for eviction. Thank you for voting!
          </p>
        </motion.div>
      </div>
    </div>
  )
}
