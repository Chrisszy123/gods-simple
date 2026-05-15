import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'

const prisma = new PrismaClient()

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const GODW_KEY = 'godw_leaderboard'

const WEEK_2_STAGE_NAMES = [
  'Arigem',
  'Clinton',
  'Deeplydan',
  'Street Brothers',
  'Ugochukwu Nwinya',
  'Manuel Ace',
]

async function reset() {
  // 1. Deactivate all existing GODW rounds
  const deactivated = await prisma.godwRound.updateMany({ where: { isActive: true }, data: { isActive: false } })
  console.log(`Deactivated ${deactivated.count} existing round(s).`)

  // 2. Look up contestant IDs
  const contestants = await prisma.contestant.findMany({
    where: { stageName: { in: WEEK_2_STAGE_NAMES } },
    select: { id: true, stageName: true },
  })

  const missing = WEEK_2_STAGE_NAMES.filter((n) => !contestants.find((c) => c.stageName === n))
  if (missing.length > 0) {
    console.warn(`⚠ Not found in DB: ${missing.join(', ')}`)
  }

  const contestantIds = contestants.map((c) => c.id)
  console.log(`Found ${contestants.length} contestants: ${contestants.map((c) => c.stageName).join(', ')}`)

  // 3. Delete all GODW votes for these contestants so IPs can vote again
  const deleted = await prisma.godwVote.deleteMany({
    where: { contestantId: { in: contestantIds } },
  })
  console.log(`Deleted ${deleted.count} GODW vote record(s).`)

  // 4. Reset godwVoteCount to 0 for these contestants
  await prisma.contestant.updateMany({
    where: { id: { in: contestantIds } },
    data: { godwVoteCount: 0 },
  })
  console.log('Reset godwVoteCount to 0 for all round contestants.')

  // 5. Clear Redis sorted set
  await redis.del(GODW_KEY)
  console.log(`Cleared Redis key "${GODW_KEY}".`)

  // 6. Create new 5-day round
  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + 5)

  const round = await prisma.godwRound.create({
    data: {
      name:         'Week 2',
      startsAt:     now,
      endsAt,
      isActive:     true,
      contestantIds,
    },
  })

  console.log(`\n✅ New GODW Round created: "${round.name}"`)
  console.log(`   Starts: ${round.startsAt.toISOString()}`)
  console.log(`   Ends:   ${round.endsAt.toISOString()} (5 days)`)
  console.log(`   Contestants: ${contestantIds.length}`)

  await prisma.$disconnect()
}

reset().catch((e) => { console.error(e); process.exit(1) })
