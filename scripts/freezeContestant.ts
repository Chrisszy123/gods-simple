/**
 * freezeContestant.ts
 *
 * Moves a contestant into frozenContestantIds on the active round.
 * They remain visible in the UI (shown as DISQUALIFIED) but the server
 * hard-rejects every vote attempt — no client-side bypass possible.
 *
 * Usage:
 *   STAGE_NAME="Arigem" npx tsx scripts/freezeContestant.ts
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const prisma = new PrismaClient()
const TARGET = process.env.STAGE_NAME

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

  console.log(`Freezing: ${contestant.stageName} (${contestant.id})`)

  const activeRound = await prisma.godwRound.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!activeRound) {
    console.error('No active round found.')
    process.exit(1)
  }

  const alreadyFrozen = activeRound.frozenContestantIds.includes(contestant.id)
  if (alreadyFrozen) {
    console.log(`${contestant.stageName} is already frozen.`)
    return
  }

  // Ensure contestant is still in contestantIds (visible in UI)
  const contestantIds = activeRound.contestantIds.includes(contestant.id)
    ? activeRound.contestantIds
    : [...activeRound.contestantIds, contestant.id]

  await prisma.godwRound.update({
    where: { id: activeRound.id },
    data: {
      contestantIds,
      frozenContestantIds: [...activeRound.frozenContestantIds, contestant.id],
    },
  })

  console.log(`✓ ${contestant.stageName} is now frozen.`)
  console.log(`  - Still visible in leaderboard (shown as DISQUALIFIED)`)
  console.log(`  - Server hard-rejects all vote attempts with 403`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
