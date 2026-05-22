import 'dotenv/config'
import fetch from 'node-fetch'
if (!globalThis.fetch) (globalThis as unknown as Record<string, unknown>).fetch = fetch
import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'
import { EVICTION_NAMES } from '../lib/eviction'

const prisma = new PrismaClient()

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const LEADERBOARD_KEY = 'leaderboard'

async function run() {
  // 1. Look up eviction contestants
  const contestants = await prisma.contestant.findMany({
    where: { stageName: { in: EVICTION_NAMES, mode: 'insensitive' } },
    select: { id: true, stageName: true, totalVotes: true },
  })

  if (contestants.length === 0) {
    console.error('No eviction contestants found. Check EVICTION_NAMES in lib/eviction.ts.')
    process.exit(1)
  }

  const missing = EVICTION_NAMES.filter(
    n => !contestants.find(c => c.stageName.trim().toUpperCase() === n.trim().toUpperCase())
  )
  if (missing.length > 0) console.warn(`⚠  Not found in DB: ${missing.join(', ')}`)

  console.log('\nResetting eviction votes for:')
  contestants.forEach(c => console.log(`  ${c.stageName}  (was ${c.totalVotes} votes)`))

  const ids = contestants.map(c => c.id)

  // 2. Reset totalVotes to 0 in DB
  await prisma.contestant.updateMany({
    where: { id: { in: ids } },
    data: { totalVotes: 0 },
  })
  console.log(`\n✓ Reset totalVotes to 0 for ${ids.length} eviction contestants.`)

  // 3. Delete test transactions for these contestants
  const { count: txDeleted } = await prisma.transaction.deleteMany({
    where: { contestantId: { in: ids } },
  })
  console.log(`✓ Deleted ${txDeleted} transaction record(s).`)

  // 4. Remove from Redis leaderboard
  await redis.zrem(LEADERBOARD_KEY, ...ids)
  console.log(`✓ Removed ${ids.length} contestants from Redis leaderboard.`)

  console.log('\n✅ Eviction votes cleared. Ready for launch.')
  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
