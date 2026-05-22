'use client'

import { motion } from 'framer-motion'

export default function VoteBadge({ delta }: { delta: number }) {
  return (
    <motion.span
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -28, scale: 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="absolute -top-1 right-0 rounded-full pointer-events-none z-10 whitespace-nowrap px-1.5 py-0.5"
      style={{
        fontFamily: 'Nexa, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '0.7rem',
        color: '#000000',
        background: 'var(--gold)',
      }}
    >
      +{delta}
    </motion.span>
  )
}
