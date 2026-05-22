'use client'

import { motion } from 'framer-motion'

interface Props {
  stageName: string
}

export default function WinnerBanner({ stageName }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 80 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-md"
      style={{
        borderTop: '1px solid rgba(254,191,83,0.4)',
        background: 'linear-gradient(to top, rgba(254,191,83,0.14) 0%, rgba(254,191,83,0.06) 60%, transparent 100%)',
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-6 text-center">
        <motion.p
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.15 }}
          style={{
            fontFamily: 'CogsAndBolts, Impact, sans-serif',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            letterSpacing: '0.05em',
            color: 'var(--gold)',
            textShadow: '0 0 24px rgba(254,191,83,0.5)',
          }}
        >
          {stageName} wins this round!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'Nexa, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'rgba(254,191,83,0.5)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 6,
          }}
        >
          Voting has closed
        </motion.p>
      </div>
    </motion.div>
  )
}
