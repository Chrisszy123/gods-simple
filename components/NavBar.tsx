'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

const NAV_LINKS = [
  { label: 'Leaderboard', href: '/' },
  { label: 'GODW', href: '/godw', live: true },
  { label: 'Contestants', href: '/contestants' },
  { label: 'About', href: '/about' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close drawer on outside tap
  useEffect(() => {
    if (!mobileOpen) return
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8"
        style={{
          height: 64,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid rgba(254,191,83,0.12)',
        }}
      >
        {/* Left — Logo + show name */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative" style={{ height: 36, width: 36, flexShrink: 0 }}>
            <Image
              src="/images/gods.png"
              alt="Gods of the Stage"
              fill
              className="object-contain"
              priority
              style={{ filter: 'drop-shadow(0 0 8px rgba(254,191,83,0.4))' }}
            />
          </div>
          <span
            className="hidden md:block"
            style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: 14,
              color: 'var(--gold)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Gods of the Stage
          </span>
        </Link>

        {/* Center — Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} className="relative flex items-center gap-1.5 group">
                <span
                  style={{
                    fontFamily: 'Nexa, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: active ? 'var(--gold)' : 'rgba(255,255,255,0.55)',
                    transition: 'color 150ms',
                  }}
                  className="group-hover:!text-[#FEBF53]"
                >
                  {link.label}
                </span>
                {link.live && (
                  <span
                    style={{
                      fontFamily: 'Nexa, system-ui, sans-serif',
                      fontSize: 10,
                      color: 'var(--orange-red)',
                    }}
                  >
                    ●
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0"
                    style={{ height: 2, background: 'var(--gold)', borderRadius: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right — Vote Now button (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-4">
          <button
            className="hidden md:flex items-center cursor-pointer transition-all duration-200"
            onClick={() => router.push('/')}
            style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'transparent',
              border: '1px solid var(--gold)',
              borderRadius: 6,
              height: 32,
              paddingLeft: 16,
              paddingRight: 16,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = 'var(--gold)'
              el.style.color = '#000'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.color = 'var(--gold)'
            }}
          >
            Vote Now
          </button>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center gap-1.5 cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Open menu"
            style={{ width: 24, height: 24, background: 'none', border: 'none', padding: 0 }}
          >
            <span style={{ width: 24, height: 2, background: 'var(--gold)', borderRadius: 1, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: 'var(--gold)', borderRadius: 1, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: 'var(--gold)', borderRadius: 1, display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={drawerRef}
            key="mobile-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="fixed top-[56px] md:hidden left-0 right-0 z-40 overflow-hidden"
            style={{
              background: '#000000',
              borderBottom: '1px solid rgba(254,191,83,0.15)',
            }}
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-6"
                    style={{
                      height: 48,
                      fontFamily: 'CogsAndBolts, Impact, sans-serif',
                      fontSize: 18,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: active ? 'var(--gold)' : 'rgba(255,255,255,0.7)',
                      borderBottom: '1px solid rgba(254,191,83,0.07)',
                    }}
                  >
                    {link.label}
                    {link.live && (
                      <span style={{ fontSize: 10, color: 'var(--orange-red)' }}>●</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
