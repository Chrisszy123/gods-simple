/**
 * Simulate random votes against real DB + Redis + Pusher (all optional).
 * Mirrors exactly what the vote worker does so the leaderboard reacts live.
 *
 * Usage:
 *   npx tsx scripts/simulateVotes.ts                  # runs forever, 1 vote burst/1.5 s
 *   npx tsx scripts/simulateVotes.ts --count=50        # stop after 50 bursts
 *   npx tsx scripts/simulateVotes.ts --interval=500    # faster: burst every 500 ms
 *   npx tsx scripts/simulateVotes.ts --count=100 --interval=200
 *
 *   npm run sim:votes                                  # shorthand
 *
 * Ctrl+C to stop at any time.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import Pusher from 'pusher'
import { randomUUID } from 'crypto'

// ─── Config from CLI args ─────────────────────────────────────────────────────

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  })
)

const MAX_BURSTS  = argv.count    ? parseInt(argv.count, 10)    : Infinity
const INTERVAL_MS = argv.interval ? parseInt(argv.interval, 10) : 1500

// ─── Clients ──────────────────────────────────────────────────────────────────

const prisma = new PrismaClient({ log: [] })

// Redis — connect with a short timeout; disable if unavailable
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue:   false,
  connectTimeout:       2000,
  lazyConnect:          true,
})
redis.on('error', () => {}) // swallow — we check `redisOk` before each use

// Pusher — only instantiate if all four keys are present
const hasPusher =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.NEXT_PUBLIC_PUSHER_KEY &&
  !!process.env.PUSHER_SECRET &&
  !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER

const pusher = hasPusher
  ? new Pusher({
      appId:   process.env.PUSHER_APP_ID!,
      key:     process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret:  process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS:  true,
    })
  : null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Weighted random pick — higher weight = chosen more often */
function weightedPick<T>(items: T[], weights: number[]): T {
  let sum = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    sum -= weights[i]
    if (sum <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** Inline progress bar */
function bar(value: number, max: number, width = 24) {
  const filled = Math.round((value / Math.max(max, 1)) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Test Redis connectivity once upfront
  let redisOk = false
  try {
    await redis.connect()
    await redis.ping()
    redisOk = true
  } catch {
    /* silent — leaderboard route falls back to Postgres */
  }

  console.log('\n┌─────────────────────────────────────────────────┐')
  console.log('│        Gods of the Stage — Vote Simulator       │')
  console.log('└─────────────────────────────────────────────────┘')
  console.log(`  Redis  : ${redisOk    ? '✅ connected'          : '⚠️  offline (Postgres-only)'}`)
  console.log(`  Pusher : ${pusher     ? '✅ realtime events on' : '⚠️  not configured'}`)
  console.log(`  Speed  : one burst every ${INTERVAL_MS} ms`)
  console.log(`  Limit  : ${MAX_BURSTS === Infinity ? 'unlimited (Ctrl+C to stop)' : `${MAX_BURSTS} bursts`}`)
  console.log()

  const allContestants = await prisma.contestant.findMany()

  if (allContestants.length === 0) {
    console.error('❌  No contestants in database.\n    Run:  npm run seed:mock\n')
    process.exit(1)
  }

  console.log(`  Found ${allContestants.length} contestants:\n`)
  for (const c of allContestants) {
    console.log(`    • ${c.stageName.padEnd(18)} (${c.totalVotes} votes)`)
  }
  console.log()

  let bursts      = 0
  let totalVotes  = 0

  const shutdown = async () => {
    console.log(`\n\n🛑  Stopped — ${bursts} bursts, ${totalVotes} votes added total.`)
    await prisma.$disconnect()
    if (redisOk) redis.disconnect()
    process.exit(0)
  }
  process.on('SIGINT',  shutdown)
  process.on('SIGTERM', shutdown)

  // ── Simulation loop ─────────────────────────────────────────────────────────
  while (bursts < MAX_BURSTS) {
    // Reload current vote counts so weights stay accurate
    const current  = await prisma.contestant.findMany({ orderBy: { totalVotes: 'desc' } })
    const maxVotes = Math.max(...current.map((c) => c.totalVotes), 1)

    // Weight = flat base + proportional boost (popular → ~3× more traffic)
    const weights  = current.map((c) => 10 + (c.totalVotes / maxVotes) * 20)
    const chosen   = weightedPick(current, weights)

    const votes      = Math.floor(Math.random() * 5) + 1  // 1–5 per burst
    const amountKobo = votes * 10_000                      // ₦100 per vote
    const ref        = `mock_${randomUUID().replace(/-/g, '').slice(0, 20)}`

    // 1. Persist vote to Postgres
    const updated = await prisma.contestant.update({
      where: { id: chosen.id },
      data:  { totalVotes: { increment: votes } },
    })

    // 2. Record transaction (mirrors the real vote worker)
    await prisma.transaction.create({
      data: {
        paystackRef:  ref,
        contestantId: chosen.id,
        amountKobo,
        votes,
        status: 'success',
      },
    })

    // 3. Update Redis sorted set
    if (redisOk) {
      try {
        await redis.zincrby('leaderboard', votes, chosen.id)
      } catch {
        redisOk = false
      }
    }

    // 4. Broadcast Pusher VOTE_UPDATE
    if (pusher) {
      try {
        await pusher.trigger('leaderboard', 'VOTE_UPDATE', {
          contestantId:   chosen.id,
          newTotalVotes:  updated.totalVotes,
          delta:          votes,
        })
      } catch {
        /* non-fatal */
      }
    }

    bursts     += 1
    totalVotes += votes

    const progressLabel = MAX_BURSTS === Infinity
      ? `[${String(bursts).padStart(5)}]`
      : `[${String(bursts).padStart(5)}/${MAX_BURSTS}]`

    console.log(
      `${progressLabel}  +${String(votes).padStart(1)} vote${votes > 1 ? 's' : ' '}`
      + `  →  ${chosen.stageName.padEnd(18)}`
      + `  ${String(updated.totalVotes).padStart(6)} total`
      + `  ${bar(updated.totalVotes, maxVotes + votes)}`
    )

    await sleep(INTERVAL_MS)
  }

  await shutdown()
}

main().catch(async (err) => {
  console.error('\n❌  Fatal error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
