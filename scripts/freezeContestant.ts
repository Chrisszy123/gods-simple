/**
 * freezeContestant.ts
 *
 * Freezes a contestant for a specified duration (default 72h).
 * They remain visible in the UI (shown as DISQUALIFIED with a countdown)
 * but the server hard-rejects all vote attempts until the freeze expires.
 * After expiry they automatically become active again — no manual intervention needed.
 *
 * Usage:
 *   STAGE_NAME="Arigem" npx tsx scripts/freezeContestant.ts
 *   STAGE_NAME="Arigem" HOURS=48 npx tsx scripts/freezeContestant.ts
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const prisma = new PrismaClient()
const TARGET = process.env.STAGE_NAME
const HOURS = parseInt(process.env.HOURS ?? '72', 10)

async function main() {
  if (!TARGET) {
    console.error('Set STAGE_NAME env var. e.g. STAGE_NAME="Arigem" npx tsx scripts/freezeContestant.ts')
    process.exit(1)
  }

  const contestant = await prisma.contestant.findFirst({
    where: { stageName: { equals: TARGET, mode: 'insensitive' } },
  })

  if (!contestant) {
    console.error(`No contestant found with stageName "${TARGET}"`)
    process.exit(1)
  }

  const activeRound = await prisma.godwRound.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!activeRound) {
    console.error('No active round found.')
    process.exit(1)
  }

  const frozenUntil = new Date(Date.now() + HOURS * 60 * 60 * 1000)

  // Ensure contestant stays visible in contestantIds
  const contestantIds = activeRound.contestantIds.includes(contestant.id)
    ? activeRound.contestantIds
    : [...activeRound.contestantIds, contestant.id]

  await Promise.all([
    // Add to frozenContestantIds so the leaderboard API knows to look up freeze expiry
    prisma.godwRound.update({
      where: { id: activeRound.id },
      data: {
        contestantIds,
        frozenContestantIds: activeRound.frozenContestantIds.includes(contestant.id)
          ? activeRound.frozenContestantIds
          : [...activeRound.frozenContestantIds, contestant.id],
      },
    }),
    // Upsert the freeze record with expiry
    prisma.godwFreeze.upsert({
      where: { contestantId_roundId: { contestantId: contestant.id, roundId: activeRound.id } },
      create: { contestantId: contestant.id, roundId: activeRound.id, frozenUntil },
      update: { frozenUntil },
    }),
  ])

  console.log(`✓ ${contestant.stageName} frozen for ${HOURS} hours.`)
  console.log(`  Freeze expires: ${frozenUntil.toLocaleString()}`)
  console.log(`  After that they are automatically active for voting again.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
