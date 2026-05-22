/**
 * Seed 10 mock contestants + one active VotingRound without calling Paystack.
 * Safe to re-run — existing records are skipped.
 *
 * Usage:  npx tsx scripts/seedMockContestants.ts
 *     or  npm run seed:mock
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MOCK_CONTESTANTS = [
  { name: 'Adaeze Okonkwo',      stageName: 'Ada Divine',      imageUrl: 'https://i.pravatar.cc/150?u=ada' },
  { name: 'Chukwuemeka Nwosu',   stageName: 'King Emeka',      imageUrl: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Fatima Al-Hassan',    stageName: 'Fatima Fierce',   imageUrl: 'https://i.pravatar.cc/150?u=fatima' },
  { name: 'Babatunde Adeleke',   stageName: 'Baba Thunder',    imageUrl: 'https://i.pravatar.cc/150?u=baba' },
  { name: 'Ngozi Ikechukwu',     stageName: 'Ngozi Gold',      imageUrl: 'https://i.pravatar.cc/150?u=ngozi' },
  { name: 'Seun Olawale',        stageName: 'Seun Blazer',     imageUrl: 'https://i.pravatar.cc/150?u=seun' },
  { name: 'Amaka Obi',           stageName: 'Queen Amaka',     imageUrl: 'https://i.pravatar.cc/150?u=amaka' },
  { name: 'Taiwo Adesanya',      stageName: 'Twin Fire',       imageUrl: 'https://i.pravatar.cc/150?u=taiwo' },
  { name: 'Emeka Chibuike',      stageName: 'The Legend',      imageUrl: 'https://i.pravatar.cc/150?u=legend' },
  { name: 'Blessing Okafor',     stageName: 'Queenie B',       imageUrl: 'https://i.pravatar.cc/150?u=queenieb' },
] as const

// Deterministic fake NUBAN numbers so re-seeding always produces the same IDs
const FAKE_ACCOUNT_NUMBER = (index: number) => `900100${String(index + 1).padStart(4, '0')}`
const FAKE_CUSTOMER_ID    = (stageName: string) =>
  `CUS_mock_${stageName.toLowerCase().replace(/\s+/g, '')}`

async function main() {
  console.log('🌱  Seeding mock contestants…\n')

  let created = 0
  let skipped = 0

  for (let i = 0; i < MOCK_CONTESTANTS.length; i++) {
    const c = MOCK_CONTESTANTS[i]
    const existing = await prisma.contestant.findFirst({
      where: { stageName: c.stageName },
      select: { id: true },
    })

    if (existing) {
      console.log(`   ⏭️   ${c.stageName.padEnd(18)} already exists — skipped`)
      skipped++
      continue
    }

    await prisma.contestant.create({
      data: {
        name:                 c.name,
        stageName:            c.stageName,
        imageUrl:             c.imageUrl,
        paystackCustomerId:   FAKE_CUSTOMER_ID(c.stageName),
        virtualAccountNumber: FAKE_ACCOUNT_NUMBER(i),
        virtualAccountBank:   'Mock Bank (Wema)',
        totalVotes:           0,
      },
    })

    console.log(`   ✅  ${c.stageName.padEnd(18)} → account ${FAKE_ACCOUNT_NUMBER(i)}`)
    created++
  }

  // Create an active VotingRound if none exists
  const activeRound = await prisma.votingRound.findFirst({
    where: { isActive: true },
  })

  if (!activeRound) {
    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    const round = await prisma.votingRound.create({
      data: {
        name:     'Season 1 — Episode 1',
        endsAt,
        isActive: true,
      },
    })
    console.log(
      `\n   🎬  Created voting round: "${round.name}"\n       Ends: ${endsAt.toLocaleString()}`
    )
  } else {
    console.log(`\n   🎬  Active round already exists: "${activeRound.name}"`)
  }

  console.log(`\n✨  Done — ${created} created, ${skipped} skipped.\n`)
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
