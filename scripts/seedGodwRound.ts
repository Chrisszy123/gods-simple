import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WEEK_1_STAGE_NAMES = [
  'Arigem',
  'Clinton',
  'Deeplydan',
  'Street Brothers',
  'Ugochukwu Nwinya',
  'Manuel Ace',
]

async function seed() {
  // Deactivate any existing GODW rounds
  await prisma.godwRound.updateMany({ where: { isActive: true }, data: { isActive: false } })
  console.log('Deactivated existing GODW rounds.')

  // Look up contestant IDs by stage name
  const contestants = await prisma.contestant.findMany({
    where: { stageName: { in: WEEK_1_STAGE_NAMES } },
    select: { id: true, stageName: true },
  })

  console.log(`Found ${contestants.length}/${WEEK_1_STAGE_NAMES.length} contestants:`)
  contestants.forEach((c) => console.log(`  ✓ ${c.stageName} (${c.id})`))

  const missing = WEEK_1_STAGE_NAMES.filter((n) => !contestants.find((c) => c.stageName === n))
  if (missing.length > 0) {
    console.warn(`  ⚠ Not found in DB: ${missing.join(', ')}`)
  }

  const contestantIds = contestants.map((c) => c.id)

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + 7) // 7 days from now

  const round = await prisma.godwRound.create({
    data: {
      name:         'Week 1',
      startsAt:     now,
      endsAt,
      isActive:     true,
      contestantIds,
    },
  })

  console.log(`\n✅ GODW Round created: "${round.name}"`)
  console.log(`   Starts: ${round.startsAt.toISOString()}`)
  console.log(`   Ends:   ${round.endsAt.toISOString()}`)
  console.log(`   Contestants: ${contestantIds.length}`)

  await prisma.$disconnect()
}

seed().catch((e) => { console.error(e); process.exit(1) })
