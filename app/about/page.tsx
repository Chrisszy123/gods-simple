'use client'

import Image from 'next/image'


export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 bottom-0 h-[65vh]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(213,66,30,0.38) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(254,191,83,0.07) 0%, transparent 65%)' }} />
      </div>

      <div className="relative z-10 max-w-[680px] mx-auto px-6 py-16">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative" style={{ height: 100, width: 200 }}>
            <Image
              src="/images/gods.png"
              alt="Gods of the Stage"
              fill
              className="object-contain"
              style={{ filter: 'drop-shadow(0 0 16px rgba(254,191,83,0.35))' }}
            />
          </div>
        </div>

        <h1
          className="text-center mb-10"
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 48,
            color: 'var(--gold)',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
          }}
        >
          ABOUT GODS OF THE STAGE
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            'Gods of the Stage is a live talent competition where extraordinary performers battle for the crown. Night after night, artists take to the stage to prove they deserve to be called a god among performers.',
            'Every contestant brings something unique — raw talent, relentless charisma, and the kind of stage presence that stops time. The audience decides who rises and who falls through the power of their vote.',
            'The paid leaderboard reflects real-time support from fans who back their favourite with every naira. The God of the Week free vote gives every fan — regardless of budget — a voice in the competition.',
            'The show is bigger than any one performer. It is a celebration of Nigerian entertainment culture, bringing together the best talent and the most passionate fans in one electric arena.',
          ].map((text, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'Nexa, system-ui, sans-serif',
                fontWeight: 400,
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.8,
              }}
            >
              {text}
            </p>
          ))}
        </div>

        {/* How Voting Works */}
        <div className="mt-14 mb-10">
          <h2
            className="mb-6"
            style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: 28,
              color: '#ffffff',
              letterSpacing: '0.08em',
            }}
          >
            HOW VOTING WORKS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VotingCard
              emoji="💰"
              title="PAID VOTING"
              body="Transfer any amount to your favourite contestant's virtual account. Every ₦100 = 1 vote. Votes reflect instantly on the live leaderboard — no cap, vote as much as you like."
            />
            <VotingCard
              emoji="⚡"
              title="GOD OF THE WEEK"
              body="Everyone gets one free vote per round. No payment needed. Your IP is your ballot — use it wisely. The contestant with the most free votes at the end of the round wins the title."
            />
          </div>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-6 mt-10">
          <a
            href="#"
            aria-label="Instagram"
            style={{ color: 'var(--gold)', fontSize: '1.5rem', opacity: 0.7, transition: 'opacity 200ms' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7' }}
          >
            📸
          </a>
          <a
            href="#"
            aria-label="Twitter / X"
            style={{ color: 'var(--gold)', fontSize: '1.5rem', opacity: 0.7, transition: 'opacity 200ms' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7' }}
          >
            𝕏
          </a>
        </div>
      </div>
    </div>
  )
}

function VotingCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(254,191,83,0.2)',
        borderRadius: 12,
        padding: '20px 18px',
      }}
    >
      <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>{emoji}</p>
      <h3
        style={{
          fontFamily: 'CogsAndBolts, Impact, sans-serif',
          fontSize: 16,
          color: 'var(--gold)',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'Nexa, system-ui, sans-serif',
          fontWeight: 400,
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7,
        }}
      >
        {body}
      </p>
    </div>
  )
}
