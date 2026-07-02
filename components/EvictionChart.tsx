'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import PusherClient from 'pusher-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartContestant {
  id: string
  stageName: string
  name: string
  imageUrl: string | null
  totalVotes: number
  virtualAccountNumber?: string
  virtualAccountBank?: string
}

interface Ranked extends ChartContestant {
  rank: number
}

interface DeltaBadge {
  contestantId: string
  delta: number
  key: number
}

interface SvgLine { x: number; y1: number; y2: number; id: string }

interface SvgData {
  safeLines: SvgLine[]
  atRiskLines: SvgLine[]
  barY: number; barX1: number; barX2: number
  width: number; height: number
}

export interface EvictionChartProps {
  contestants: ChartContestant[]
  preview?: boolean
  limit?: number
  votingOpen?: boolean
  votingOpensAt?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toRanked(arr: ChartContestant[], alphabetical = false): Ranked[] {
  return [...arr]
    .sort((a, b) => alphabetical
      ? a.stageName.localeCompare(b.stageName)
      : b.totalVotes - a.totalVotes)
    .map((c, i) => ({ ...c, rank: i + 1 }))
}

function displaySafe(arr: Ranked[]): Ranked[] {
  return [...arr]
}

function scrambleAtRisk(arr: Ranked[]): Ranked[] {
  return [...arr]
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)

  function copy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={copy}
      title="Copy account number"
      style={{
        flexShrink: 0,
        fontFamily: 'Nexa, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: small ? 8 : 9,
        letterSpacing: '0.08em',
        color: copied ? '#000' : '#FEBF53',
        background: copied ? '#FEBF53' : 'rgba(254,191,83,0.12)',
        border: `1px solid ${copied ? '#FEBF53' : 'rgba(254,191,83,0.3)'}`,
        borderRadius: 4,
        padding: small ? '2px 5px' : '3px 7px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ COPIED' : 'COPY'}
    </button>
  )
}

// ── Delta float badge ─────────────────────────────────────────────────────────

function DeltaFloat({ delta }: { delta: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -28 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{
        position: 'absolute', top: -6, right: 2,
        fontFamily: 'CogsAndBolts, Impact, sans-serif',
        fontSize: 11, color: '#FEBF53',
        pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap',
      }}
    >
      +{delta}
    </motion.div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.35 }} />
      <p style={{
        fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
        fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
        color, whiteSpace: 'nowrap',
      }}>
        {text}
      </p>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.35 }} />
    </div>
  )
}

// ── Contestant card ───────────────────────────────────────────────────────────

interface CardProps {
  contestant: Ranked
  totalVotes: number
  isSafe: boolean
  badge?: DeltaBadge
  preview: boolean
  votingOpen: boolean
  votingOpensAt?: string
  cardRef?: (el: HTMLDivElement | null) => void
}

function ContestantCard({ contestant, totalVotes, isSafe, badge, preview, votingOpen, votingOpensAt, cardRef }: CardProps) {
  const pct     = totalVotes > 0 ? (contestant.totalVotes / totalVotes) * 100 : 0
  const isFirst = contestant.rank === 1

  // All cards share the same base size; #1 gets a slight bump
  const desktopWidth = isFirst && isSafe ? 210 : 190

  const avatarSize = preview ? 52 : 72
  const nameSize   = preview ? 12 : 15

  const acctNum  = contestant.virtualAccountNumber
  const acctBank = contestant.virtualAccountBank

  return (
    <motion.div
      layoutId={`chart-contestant-${contestant.id}`}
      layout
      ref={cardRef}
      animate={{
        borderColor: isSafe ? '#FEBF53' : 'rgba(213,66,30,0.35)',
        background:  isSafe ? 'rgba(254,191,83,0.08)' : 'rgba(213,66,30,0.05)',
        boxShadow: isSafe
          ? isFirst
            ? '0 0 28px rgba(254,191,83,0.3), 0 0 56px rgba(254,191,83,0.1)'
            : '0 0 18px rgba(254,191,83,0.18)'
          : 'none',
      }}
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, duration: 0.4 }}
      style={{
        position: 'relative',
        // On mobile this is full-width via the parent grid; on desktop we set a fixed width
        width: '100%',
        maxWidth: desktopWidth,
        borderRadius: 14,
        padding: '12px 14px 14px',
        border: `${isSafe ? 2 : 1}px solid`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {/* Rank #1 pulsing glow */}
      {isFirst && isSafe && !preview && (
        <motion.div
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(254,191,83,0.14) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Tier badge */}
      <motion.div
        animate={{
          background: isSafe ? '#FEBF53' : '#D5421E',
          color: isSafe ? '#000000' : '#ffffff',
        }}
        transition={{ duration: 0.3 }}
        style={{
          fontFamily: 'CogsAndBolts, Impact, sans-serif',
          fontSize: 9,
          letterSpacing: '0.1em',
          borderRadius: 99,
          padding: '2px 10px',
          marginBottom: 7,
        }}
      >
        {isSafe ? 'SAFE ✓' : 'AT RISK'}
      </motion.div>



      {/* Avatar */}
      <div style={{
        position: 'relative', width: avatarSize, height: avatarSize,
        borderRadius: '50%', overflow: 'hidden',
        border: isSafe ? '2px solid #FEBF53' : '1px solid rgba(213,66,30,0.4)',
        boxShadow: isSafe ? '0 0 12px rgba(254,191,83,0.35)' : undefined,
        marginBottom: 8, flexShrink: 0,
      }}>
        {contestant.imageUrl ? (
          <Image src={contestant.imageUrl} alt={contestant.stageName} fill className="object-cover" unoptimized />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isSafe ? 'rgba(254,191,83,0.12)' : 'rgba(213,66,30,0.1)',
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: '1.3rem',
            color: isSafe ? '#FEBF53' : 'rgba(213,66,30,0.5)',
          }}>
            {contestant.stageName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Stage name */}
      <p style={{
        fontFamily: 'CogsAndBolts, Impact, sans-serif',
        fontSize: nameSize, color: '#ffffff',
        textAlign: 'center', marginBottom: 4, lineHeight: 1.2,
        width: '100%', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {contestant.stageName}
      </p>

      <div style={{ marginBottom: !preview && acctNum ? 10 : 6 }} />

      {/* Account number / voting status — only on full chart (not preview) */}
      {!preview && (
        <div style={{
          width: '100%',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          padding: '8px 10px',
          border: `1px solid ${votingOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'}`,
        }}>
          {votingOpen && acctNum ? (
            <>
              <p style={{
                fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 700,
                fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)', marginBottom: 5,
              }}>
                {acctBank ?? 'Bank'} · Transfer to vote
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <p style={{
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                  color: isSafe ? '#FEBF53' : 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.05em', lineHeight: 1,
                  flex: 1, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {acctNum}
                </p>
                <CopyButton text={acctNum} small />
              </div>
              <p style={{
                fontFamily: 'Nexa, system-ui, sans-serif', fontWeight: 400,
                fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em',
              }}>
                ₦200 = 1 vote
              </p>
            </>
          ) : (
            <p style={{
              fontFamily: 'CogsAndBolts, Impact, sans-serif',
              fontSize: 9, letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
            }}>
              🔒 Voting opens 6:00 PM
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EvictionChart({ contestants: initial, preview = false, limit = 20, votingOpen = true, votingOpensAt }: EvictionChartProps) {
  // Alphabetical only BEFORE voting has ever started; after close, keep vote order
  const preVoting = votingOpensAt ? new Date() < new Date(votingOpensAt) : false
  const [sorted, setSorted]   = useState<Ranked[]>(() => toRanked(initial, preVoting).slice(0, limit))
  const [badges, setBadges]   = useState<DeltaBadge[]>([])
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const [svgData, setSvgData] = useState<SvgData | null>(null)

  const badgeKeyRef    = useRef(0)
  const chartRef       = useRef<HTMLDivElement>(null)
  const safeCardRefs   = useRef<(HTMLDivElement | null)[]>([])
  const atRiskCardRefs = useRef<(HTMLDivElement | null)[]>([])

  const safe           = useMemo(() => sorted.slice(0, 1), [sorted])
  const atRisk         = useMemo(() => sorted.slice(1),    [sorted])
  const totalVotes     = useMemo(() => sorted.reduce((s, c) => s + c.totalVotes, 0), [sorted])
  const showConnectors = safe.length >= 1 && atRisk.length > 0

  // ── Pusher ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (preview) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return

    const pusher  = new PusherClient(key, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu' })
    const channel = pusher.subscribe('leaderboard')

    channel.bind('VOTE_UPDATE', ({ contestantId, newTotalVotes, delta }: { contestantId: string; newTotalVotes: number; delta: number }) => {
      setSorted(prev => toRanked(prev.map(c => c.id === contestantId ? { ...c, totalVotes: newTotalVotes } : c), preVoting).slice(0, limit))

      badgeKeyRef.current += 1
      const k = badgeKeyRef.current
      setBadges(prev => [...prev, { contestantId, delta, key: k }])
      setTimeout(() => setBadges(prev => prev.filter(b => b.key !== k)), 1500)

      setFlashIds(prev => { const s = new Set(prev); s.add(contestantId); return s })
      setTimeout(() => setFlashIds(prev => { const s = new Set(prev); s.delete(contestantId); return s }), 800)
    })

    return () => { channel.unbind_all(); pusher.unsubscribe('leaderboard'); pusher.disconnect() }
  }, [preview, limit])

  // ── SVG connector lines ───────────────────────────────────────────────────
  const recalcLines = useCallback(() => {
    if (!showConnectors || !chartRef.current) return
    const chartRect = chartRef.current.getBoundingClientRect()
    if (chartRect.width === 0 || chartRect.height === 0) return

    const safePoints = safeCardRefs.current
      .slice(0, safe.length)
      .map((el, i) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left - chartRect.left + r.width / 2, bottom: r.bottom - chartRect.top, id: safe[i]?.id ?? '' }
      })
      .filter((p): p is { x: number; bottom: number; id: string } => p !== null && p.id !== '')

    const atRiskPoints = atRiskCardRefs.current
      .slice(0, atRisk.length)
      .map((el, i) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left - chartRect.left + r.width / 2, top: r.top - chartRect.top, id: atRisk[i]?.id ?? '' }
      })
      .filter((p): p is { x: number; top: number; id: string } => p !== null && p.id !== '')

    if (!safePoints.length || !atRiskPoints.length) return

    const safeBottom = Math.max(...safePoints.map(p => p.bottom))
    const atRiskTop  = Math.min(...atRiskPoints.map(p => p.top))
    const barY       = (safeBottom + atRiskTop) / 2
    const allX       = [...safePoints.map(p => p.x), ...atRiskPoints.map(p => p.x)]

    setSvgData({
      safeLines:   safePoints.map(p  => ({ x: p.x, y1: p.bottom, y2: barY,  id: p.id })),
      atRiskLines: atRiskPoints.map(p => ({ x: p.x, y1: barY,    y2: p.top, id: p.id })),
      barY, barX1: Math.min(...allX), barX2: Math.max(...allX),
      width: chartRect.width, height: chartRect.height,
    })
  }, [safe, atRisk, showConnectors])

  useEffect(() => { const t = setTimeout(recalcLines, 350); return () => clearTimeout(t) }, [recalcLines, sorted])
  useEffect(() => {
    recalcLines()
    window.addEventListener('resize', recalcLines)
    return () => window.removeEventListener('resize', recalcLines)
  }, [recalcLines])

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <p style={{ fontFamily: 'Nexa, system-ui, sans-serif', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
          No contestants yet.
        </p>
      </div>
    )
  }

  // ── Mobile card grid (< md) ───────────────────────────────────────────────
  // 2-column grid so cards are wide enough to read the account number
  const mobileGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    width: '100%',
  }

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────────────────── */}
      <div className="md:hidden" style={{ width: '100%' }}>
        <SectionLabel text="⚡ Safe Zone" color="#FEBF53" />
        <div style={mobileGrid}>
          {displaySafe(safe).map(c => (
            <ContestantCard key={c.id} contestant={c} totalVotes={totalVotes} isSafe
              badge={badges.find(b => b.contestantId === c.id)} preview={preview}
              votingOpen={votingOpen} votingOpensAt={votingOpensAt} />
          ))}
        </div>

        {atRisk.length > 0 && (
          <>
            <div style={{ width: 1, height: 28, background: 'rgba(254,191,83,0.25)', margin: '14px auto' }} />
            <SectionLabel text="🔴 At Risk Of Eviction" color="#D5421E" />
            <div style={mobileGrid}>
              {scrambleAtRisk(atRisk).map(c => (
                <ContestantCard key={c.id} contestant={c} totalVotes={totalVotes} isSafe={false}
                  badge={badges.find(b => b.contestantId === c.id)} preview={preview}
                  votingOpen={votingOpen} votingOpensAt={votingOpensAt} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────── */}
      <div ref={chartRef} className="hidden md:block" style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
        {/* SVG connector overlay */}
        {svgData && showConnectors && (
          <svg style={{
            position: 'absolute', top: 0, left: 0,
            width: svgData.width, height: svgData.height,
            zIndex: 0, pointerEvents: 'none', overflow: 'visible',
          }}>
            {svgData.safeLines.map(line => (
              <line key={`safe-${line.id}`}
                x1={line.x} y1={line.y1} x2={line.x} y2={line.y2}
                stroke={flashIds.has(line.id) ? 'rgba(254,191,83,0.8)' : 'rgba(254,191,83,0.25)'}
                strokeWidth={1} style={{ transition: 'stroke 0.3s ease' }} />
            ))}
            <line
              x1={svgData.barX1} y1={svgData.barY} x2={svgData.barX2} y2={svgData.barY}
              stroke="rgba(254,191,83,0.25)" strokeWidth={1} />
            {svgData.atRiskLines.map(line => (
              <line key={`atrisk-${line.id}`}
                x1={line.x} y1={line.y1} x2={line.x} y2={line.y2}
                stroke={flashIds.has(line.id) ? 'rgba(254,191,83,0.8)' : 'rgba(254,191,83,0.25)'}
                strokeWidth={1} style={{ transition: 'stroke 0.3s ease' }} />
            ))}
          </svg>
        )}

        {/* Safe tier */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel text="⚡ Safe Zone" color="#FEBF53" />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, paddingBottom: 52 }}>
            {displaySafe(safe).map((c, i) => (
              <ContestantCard key={c.id} contestant={c} totalVotes={totalVotes} isSafe
                badge={badges.find(b => b.contestantId === c.id)} preview={preview}
                votingOpen={votingOpen} votingOpensAt={votingOpensAt}
                cardRef={el => { safeCardRefs.current[i] = el }} />
            ))}
          </div>
        </div>

        {/* At-risk tier */}
        {atRisk.length > 0 && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <SectionLabel text="🔴 At Risk Of Eviction" color="#D5421E" />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {scrambleAtRisk(atRisk).map((c, i) => (
                <ContestantCard key={c.id} contestant={c} totalVotes={totalVotes} isSafe={false}
                  badge={badges.find(b => b.contestantId === c.id)} preview={preview}
                  votingOpen={votingOpen} votingOpensAt={votingOpensAt}
                  cardRef={el => { atRiskCardRefs.current[i] = el }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
