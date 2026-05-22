import 'dotenv/config'
// node-fetch polyfill needed on Node 16 (fetch built-in only from Node 18)
import fetch from 'node-fetch'
if (!globalThis.fetch) (globalThis as unknown as Record<string, unknown>).fetch = fetch
import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'
import { GODW_NAMES } from '../lib/godw'

const prisma = new PrismaClient()

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const LEADERBOARD_KEY = 'leaderboard'

async function run() {
  // 1. Look up current GODW contestants by stage name
  const contestants = await prisma.contestant.findMany({
    where: { stageName: { in: GODW_NAMES, mode: 'insensitive' } },
    select: { id: true, stageName: true, totalVotes: true, godwVoteCount: true },
  })

  if (contestants.length === 0) {
    console.error('No GODW contestants found. Check GODW_NAMES in lib/godw.ts matches DB stage names.')
    process.exit(1)
  }

  const missing = GODW_NAMES.filter(
    n => !contestants.find(c => c.stageName.trim().toUpperCase() === n.trim().toUpperCase())
  )
  if (missing.length > 0) {
    console.warn(`⚠  Not found in DB: ${missing.join(', ')}`)
  }

  console.log('\nResetting GODW votes for:')
  contestants.forEach(c =>
    console.log(`  ${c.stageName}  —  totalVotes: ${c.totalVotes}, godwVoteCount: ${c.godwVoteCount}`)
  )

  const ids = contestants.map(c => c.id)

  // 2. Zero out totalVotes (paid votes) for this week's GODW contestants
  await prisma.contestant.updateMany({
    where: { id: { in: ids } },
    data: { totalVotes: 0 },
  })
  console.log(`\n✓ Reset totalVotes to 0 for ${ids.length} GODW contestants.`)

  // 3. Zero out godwVoteCount for ALL contestants (clears the display on contestant cards)
  const { count } = await prisma.contestant.updateMany({ data: { godwVoteCount: 0 } })
  console.log(`✓ Reset godwVoteCount to 0 for all ${count} contestants.`)

  // 4. Delete all GodwVote records so IPs can vote again next week
  const { count: deletedVotes } = await prisma.godwVote.deleteMany({})
  console.log(`✓ Deleted ${deletedVotes} GodwVote record(s).`)

  // 5. Remove GODW contestants from Redis — leaderboard API falls back to DB (0)
  await redis.zrem(LEADERBOARD_KEY, ...ids)
  console.log(`✓ Removed ${ids.length} contestants from Redis leaderboard.`)

  console.log('\n✅ GODW votes cleared. New week is ready.')
  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
