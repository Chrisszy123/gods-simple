/**
 * cleanFraudVotes.ts
 *
 * Identifies votes that arrived within THRESHOLD_SECONDS of the previous vote
 * for the same contestant (different IP, bot-speed timing). Deletes them,
 * recalculates godwVoteCount in the DB, then rebuilds the Redis leaderboard
 * sorted set from the corrected counts.
 *
 * Run with:
 *   DRY_RUN=true npx tsx scripts/cleanFraudVotes.ts   ← preview only
 *   npx tsx scripts/cleanFraudVotes.ts                ← live cleanup
 */

import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const GODW_KEY = 'godw_leaderboard'
const THRESHOLD_SECONDS = 30
const DRY_RUN = process.env.DRY_RUN === 'true'

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE — changes will be written'}\n`)

  // ── Step 1: Identify fraudulent vote IDs via window-function logic ──────────
  // We fetch all votes ordered by contestant + time, then flag any vote that
  // arrived within THRESHOLD_SECONDS of the previous vote for the same contestant.
  const allVotes = await prisma.godwVote.findMany({
    orderBy: [{ contestantId: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, contestantId: true, ipAddress: true, createdAt: true },
  })

  const fraudIds: string[] = []
  const fraudByContestant: Record<string, number> = {}

  for (let i = 1; i < allVotes.length; i++) {
    const prev = allVotes[i - 1]
    const curr = allVotes[i]
    if (curr.contestantId !== prev.contestantId) continue
    const gap = (curr.createdAt.getTime() - prev.createdAt.getTime()) / 1000
    if (gap < THRESHOLD_SECONDS) {
      fraudIds.push(curr.id)
      fraudByContestant[curr.contestantId] = (fraudByContestant[curr.contestantId] ?? 0) + 1
    }
  }

  // ── Step 2: Report ──────────────────────────────────────────────────────────
  if (fraudIds.length === 0) {
    console.log('No suspicious votes found. Nothing to clean.')
    return
  }

  const contestantIds = Object.keys(fraudByContestant)
  const contestants = await prisma.contestant.findMany({
    where: { id: { in: contestantIds } },
    select: { id: true, stageName: true, godwVoteCount: true },
  })
  const nameMap: Record<string, string> = {}
  for (const c of contestants) nameMap[c.id] = c.stageName

  console.log('Fraudulent votes to remove:')
  for (const [cid, count] of Object.entries(fraudByContestant)) {
    console.log(`  ${nameMap[cid] ?? cid}: ${count} votes will be removed`)
  }
  console.log(`  Total: ${fraudIds.length} votes\n`)

  if (DRY_RUN) {
    console.log('DRY RUN — stopping here. Set DRY_RUN=false (or omit it) to apply changes.')
    return
  }

  // ── Step 3: Delete fraudulent votes ────────────────────────────────────────
  const deleted = await prisma.godwVote.deleteMany({ where: { id: { in: fraudIds } } })
  console.log(`Deleted ${deleted.count} votes from DB.`)

  // ── Step 4: Recalculate godwVoteCount for affected contestants ──────────────
  for (const cid of contestantIds) {
    const realCount = await prisma.godwVote.count({ where: { contestantId: cid } })
    await prisma.contestant.update({
      where: { id: cid },
      data: { godwVoteCount: realCount },
    })
    console.log(`  ${nameMap[cid]}: godwVoteCount reset to ${realCount}`)
  }

  // ── Step 5: Rebuild Redis sorted set ───────────────────────────────────────
  // Fetch all contestants in the active round and overwrite their Redis scores.
  const activeRound = await prisma.godwRound.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const roundIds = activeRound?.contestantIds ?? []
  const allContestants = await prisma.contestant.findMany({
    where: roundIds.length > 0 ? { id: { in: roundIds } } : undefined,
    select: { id: true, stageName: true, godwVoteCount: true },
  })

  // Delete the stale key and rebuild from corrected DB counts
  await redis.del(GODW_KEY)
  for (const c of allContestants) {
    if (c.godwVoteCount > 0) {
      await redis.zadd(GODW_KEY, { score: c.godwVoteCount, member: c.id })
    }
  }

  console.log('\nRedis leaderboard rebuilt:')
  for (const c of allContestants.sort((a, b) => b.godwVoteCount - a.godwVoteCount)) {
    console.log(`  ${c.stageName}: ${c.godwVoteCount} votes`)
  }

  console.log('\nDone. DB and Redis are now in sync.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
