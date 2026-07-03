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

        {/* Season closed pill */}
        <motion.div {...fadeUp(0.2)} className="mb-8 px-5 py-2 rounded-full"
          style={{ background: 'rgba(213,66,30,0.1)', border: '1px solid rgba(213,66,30,0.3)' }}>
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#D5421E', textAlign: 'center',
          }}>
            🏆 Season 1 — Officially Closed
          </p>
        </motion.div>

        {/* Winner card */}
        <motion.div {...fadeUp(0.26)} className="w-full mb-8" style={{
          borderRadius: 20,
          background: 'linear-gradient(145deg, rgba(254,191,83,0.12) 0%, rgba(254,191,83,0.04) 100%)',
          border: '1.5px solid rgba(254,191,83,0.45)',
          boxShadow: '0 0 48px rgba(254,191,83,0.18), 0 0 80px rgba(254,191,83,0.08)',
          padding: '28px 20px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Crown */}
          <p style={{ fontSize: '2rem', marginBottom: 12, lineHeight: 1 }}>👑</p>

          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
            fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(254,191,83,0.6)', marginBottom: 16,
          }}>
            Season 1 Winner
          </p>

          {/* Deeply Dan photo */}
          <div style={{
            width: 110, height: 110, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid #FEBF53',
            boxShadow: '0 0 32px rgba(254,191,83,0.5), 0 0 64px rgba(254,191,83,0.2)',
            marginBottom: 16, flexShrink: 0,
          }}>
            <Image
              src="/images/GOTS/DEEPLYDAN.jpg"
              alt="Deeply Dan"
              width={110} height={110}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>

          <h2 style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(1.6rem, 7vw, 2.2rem)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#FEBF53',
            textShadow: '0 0 28px rgba(254,191,83,0.5)',
            textAlign: 'center', marginBottom: 10, lineHeight: 1.1,
          }}>
            Deeply Dan
          </h2>

          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400,
            fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)',
            textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.6,
            maxWidth: 260,
          }}>
            The God of the Stage. Thank you to everyone who voted this season.
          </p>

          <div style={{ width: '80%', height: 1, background: 'rgba(254,191,83,0.2)', margin: '18px 0' }} />

          <p style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: '0.85rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(254,191,83,0.7)', textAlign: 'center',
          }}>
            ⚡ Season 2 — Coming Soon
          </p>
        </motion.div>

        {/* Top 3 podium */}
        <motion.div {...fadeUp(0.34)} className="w-full mb-8">
          <p style={{
            fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
            fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 16,
          }}>
            Top 3 Finalists
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12 }}>
            {/* 2nd — Hero */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #C0C0C0',
                boxShadow: '0 0 16px rgba(192,192,192,0.3)',
                marginBottom: 8,
              }}>
                <Image src="/images/GOTS/HERO.jpg" alt="Hero" width={72} height={72} className="object-cover w-full h-full" unoptimized />
              </div>
              <div style={{
                fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem',
                color: '#C0C0C0', marginBottom: 4,
              }}>2</div>
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '0.8rem', color: '#C0C0C0', letterSpacing: '0.06em', textAlign: 'center' }}>Hero</p>
            </div>

            {/* 1st — Deeply Dan */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <p style={{ fontSize: '1.4rem', marginBottom: 6 }}>👑</p>
              <div style={{
                width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid #FEBF53',
                boxShadow: '0 0 28px rgba(254,191,83,0.5)',
                marginBottom: 8,
              }}>
                <Image src="/images/GOTS/DEEPLYDAN.jpg" alt="Deeply Dan" width={90} height={90} className="object-cover w-full h-full" unoptimized />
              </div>
              <div style={{
                fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.8rem',
                color: '#FEBF53', textShadow: '0 0 16px rgba(254,191,83,0.5)', marginBottom: 4,
              }}>1</div>
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '0.85rem', color: '#FEBF53', letterSpacing: '0.06em', textAlign: 'center' }}>Deeply Dan</p>
            </div>

            {/* 3rd — Street Brothers */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #CD7F32',
                boxShadow: '0 0 16px rgba(205,127,50,0.3)',
                marginBottom: 8,
              }}>
                <Image src="/images/GOTS/STREET BROTHERS.jpg" alt="Street Brothers" width={72} height={72} className="object-cover w-full h-full" unoptimized />
              </div>
              <div style={{
                fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '1.4rem',
                color: '#CD7F32', marginBottom: 4,
              }}>3</div>
              <p style={{ fontFamily: 'CogsAndBolts, Impact, sans-serif', fontSize: '0.8rem', color: '#CD7F32', letterSpacing: '0.06em', textAlign: 'center' }}>Street Brothers</p>
            </div>
          </div>
        </motion.div>

        {/* Gold divider */}
        <motion.div {...fadeUp(0.38)} className="w-full mb-10"
          style={{ height: 1, background: 'linear-gradient(to right, transparent 0%, rgba(254,191,83,0.25) 30%, rgba(254,191,83,0.25) 70%, transparent 100%)' }} />

        {/* Final results link */}
        <motion.div {...fadeUp(0.3)} className="w-full mb-10">
          <Link href="/leaderboard">
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
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(254,191,83,0.5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 28px rgba(254,191,83,0.3)' }}
            >
              View Final Results →
            </button>
          </Link>
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
