'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
})

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-[70vh]"
          style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(213,66,30,0.32) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(254,191,83,0.06) 0%, transparent 65%)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pt-8 pb-16 max-w-lg mx-auto w-full">

        {/* Logo */}
        <motion.div {...fadeUp(0)} className="relative mb-6" style={{ width: 140, height: 140 }}>
          <Image
            src="/images/gods.png"
            alt="Gods of the Stage"
            fill
            className="object-contain"
            priority
            style={{ filter: 'drop-shadow(0 0 28px rgba(254,191,83,0.35))' }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1 {...fadeUp(0.1)}
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(1.6rem, 7vw, 2.6rem)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textAlign: 'center',
            textShadow: '0 0 40px rgba(254,191,83,0.25)',
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          Gods of the Stage
        </motion.h1>

        {/* Tagline */}
        <motion.p {...fadeUp(0.18)}
          style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            marginBottom: 36,
          }}
        >
          Nigeria&apos;s Premier Live Talent Competition
        </motion.p>

        {/* Gold divider */}
        <motion.div {...fadeUp(0.24)} className="w-full mb-10"
          style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.25) 30%, rgba(254,191,83,0.25) 70%, transparent 100%)' }} />

        {/* CTA buttons */}
        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 w-full mb-12">
          <Link href="/godw" className="flex-1">
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
                padding: '14px 0',
                cursor: 'pointer',
                boxShadow: '0 0 28px rgba(254,191,83,0.3)',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-light)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(254,191,83,0.5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(254,191,83,0.3)' }}
            >
              Vote — GODW ●
            </button>
          </Link>

          <Link href="/about" className="flex-1">
            <button
              style={{
                width: '100%',
                fontFamily: 'CogsAndBolts, Impact, sans-serif',
                fontSize: '1rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                background: 'transparent',
                border: '1px solid rgba(254,191,83,0.35)',
                borderRadius: 10,
                padding: '14px 0',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(254,191,83,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(254,191,83,0.35)'; e.currentTarget.style.background = 'transparent' }}
            >
              About the Show
            </button>
          </Link>
        </motion.div>

        {/* Info cards */}
        <motion.div {...fadeUp(0.38)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">

          {/* GODW — live */}
          <Link href="/godw">
            <div
              className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-[rgba(254,191,83,0.4)]"
              style={{
                background: 'rgba(254,191,83,0.06)',
                border: '1px solid rgba(254,191,83,0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  God of the Week
                </span>
                <span style={{ fontSize: 9, color: 'var(--orange-red)' }}>●</span>
              </div>
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem', color: '#ffffff', letterSpacing: '0.05em', lineHeight: 1.1, marginBottom: 8 }}>
                Free voting.<br />Live now.
              </p>
              <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                Cast your vote for the week&apos;s best performer →
              </p>
            </div>
          </Link>

          {/* Leaderboard — coming soon */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                Leaderboard
              </span>
              <span style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 6px' }}>
                Soon
              </span>
            </div>
            <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', lineHeight: 1.1, marginBottom: 8 }}>
              Paid voting.<br />Next week.
            </p>
            <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
              Support your favourite with real votes
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom wordmark */}
      <motion.footer {...fadeUp(0.5)} className="relative z-10 flex justify-center pb-6">
        <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400, fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Powered by GODS
        </p>
      </motion.footer>
    </div>
  )
}
