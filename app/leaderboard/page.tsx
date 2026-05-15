'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function LeaderboardComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">

      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-[60vh]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(213,66,30,0.18) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="relative mb-8" style={{ width: 96, height: 96 }}
        >
          <Image
            src="/images/gods.png" alt="Gods of the Stage" fill className="object-contain"
            style={{ filter: 'drop-shadow(0 0 20px rgba(254,191,83,0.25)) grayscale(0.4) opacity(0.7)' }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}
        >
          Leaderboard
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: 'clamp(2rem, 8vw, 3rem)', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 16 }}
        >
          Opens<br />Next Week
        </motion.h1>

        <motion.div
          initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          className="mb-6" style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(254,191,83,0.2), transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: 36 }}
        >
          The paid voting leaderboard opens next week.<br />
          In the meantime, vote free on GODW.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 w-full"
        >
          <Link href="/godw">
            <button
              style={{
                width: '100%',
                fontFamily: 'CogsAndBolts, Impact, sans-serif',
                fontSize: '1rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000',
                background: 'var(--gold)',
                border: 'none',
                borderRadius: 10,
                padding: '13px 0',
                cursor: 'pointer',
                boxShadow: '0 0 24px rgba(254,191,83,0.25)',
              }}
            >
              Vote — GODW ●
            </button>
          </Link>

          <Link href="/">
            <button
              style={{
                width: '100%',
                fontFamily: 'Nexa, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '13px 0',
                cursor: 'pointer',
              }}
            >
              ← Back to Home
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
