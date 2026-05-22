'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  endsAt: string
  onExpire: () => void
}

interface TimeLeft {
  h: number
  m: number
  s: number
  totalMs: number
}

function getTimeLeft(endsAt: string): TimeLeft {
  const totalMs = new Date(endsAt).getTime() - Date.now()
  if (totalMs <= 0) return { h: 0, m: 0, s: 0, totalMs: 0 }
  const totalSecs = Math.floor(totalMs / 1000)
  return {
    h: Math.floor(totalSecs / 3600),
    m: Math.floor((totalSecs % 3600) / 60),
    s: totalSecs % 60,
    totalMs,
  }
}

interface UnitBoxProps {
  value: number
  label: string
  urgent: boolean
}

function UnitBox({ value, label, urgent }: UnitBoxProps) {
  const [pulsing, setPulsing] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 160)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: 68,
          height: 68,
          background: 'rgba(254, 191, 83, 0.06)',
          border: `1px solid ${urgent ? 'rgba(213, 66, 30, 0.35)' : 'rgba(254, 191, 83, 0.15)'}`,
          transition: 'border-color 0.4s',
        }}
      >
        <span
          className={pulsing ? 'tick-pulse' : ''}
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(28px, 5vw, 42px)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: urgent ? 'var(--orange-red)' : 'var(--gold)',
            display: 'inline-block',
            transition: 'color 0.3s',
          }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'Nexa, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: urgent ? 'rgba(213, 66, 30, 0.7)' : 'rgba(254, 191, 83, 0.45)',
          transition: 'color 0.3s',
        }}
      >
        {label}
      </span>
    </div>
  )
}

const Colon = ({ urgent }: { urgent: boolean }) => (
  <span
    style={{
      fontFamily: 'CogsAndBolts, Impact, sans-serif',
      fontSize: 'clamp(22px, 4vw, 34px)',
      color: urgent ? 'var(--orange-red)' : 'var(--gold)',
      opacity: 0.4,
      paddingBottom: 20,
      transition: 'color 0.3s',
    }}
  >
    :
  </span>
)

export default function CountdownTimer({ endsAt, onExpire }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(endsAt))
  const [expired, setExpired] = useState(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const initial = getTimeLeft(endsAt)
    if (initial.totalMs <= 0) {
      setExpired(true)
      onExpireRef.current()
      return
    }

    const id = setInterval(() => {
      const t = getTimeLeft(endsAt)
      setTime(t)
      if (t.totalMs <= 0) {
        clearInterval(id)
        setExpired(true)
        onExpireRef.current()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [endsAt])

  if (expired) {
    return (
      <div
        className="voting-closed"
        style={{
          fontFamily: 'CogsAndBolts, Impact, sans-serif',
          fontSize: 'clamp(20px, 4vw, 28px)',
          letterSpacing: '0.1em',
          color: 'var(--gold)',
        }}
      >
        ⚡ VOTING CLOSED
      </div>
    )
  }

  const urgent = time.totalMs > 0 && time.totalMs < 60_000

  return (
    <div className={`flex items-end gap-2 md:gap-3 ${urgent ? 'urgent-throb' : ''}`}>
      <UnitBox value={time.h} label="HRS" urgent={urgent} />
      <Colon urgent={urgent} />
      <UnitBox value={time.m} label="MIN" urgent={urgent} />
      <Colon urgent={urgent} />
      <UnitBox value={time.s} label="SEC" urgent={urgent} />
    </div>
  )
}
