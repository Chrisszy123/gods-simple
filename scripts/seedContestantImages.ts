/**
 * seedContestantImages.ts
 * Updates imageUrl for all contestants with named photos in /public/images/GOTS/
 * Run: npx tsx scripts/seedContestantImages.ts
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

// stageName (lowercase for case-insensitive match) → public URL path
const IMAGE_MAP: Record<string, string> = {
  'arigem':              '/images/GOTS/ARIGEM.jpg',
  'azu expressions':     '/images/GOTS/AZUEXPRESSION.jpg',
  'baritorn':            '/images/GOTS/BARITORN.jpg',
  'clinton':             '/images/GOTS/CLINTON.jpg',
  'deeplydan':           '/images/GOTS/DEEPLYDAN.jpg',
  'gags':                '/images/GOTS/GAGS.jpg',
  'hero':                '/images/GOTS/HERO.jpg',
  'manuel ace':          '/images/GOTS/MANUEL ACE.jpg',
  'reiy':                '/images/GOTS/REIY.jpg',
  'rhythdm':             '/images/GOTS/RHYTHM.jpg',
  'sophiya':             '/images/GOTS/SOPHIYA.jpg',
  'symphonix':           '/images/GOTS/SYMPHONIX.jpg',
  'team unlimited':      '/images/GOTS/TEAM UNLIMITED.jpg',
  'thelordsmouthpiece':  '/images/GOTS/THELORDSMOUTHPIECE.jpg',
  'ugochukwu nwinya':    '/images/GOTS/UGOCHUKWU NWINYA.jpg',
  'vaxxie':              '/images/GOTS/VAXXIE.jpg',
}

async function main() {
  const contestants = await prisma.contestant.findMany({ select: { id: true, stageName: true } })

  let updated = 0
  let skipped = 0

  for (const c of contestants) {
    const imageUrl = IMAGE_MAP[c.stageName.toLowerCase()]
    if (!imageUrl) {
      console.log(`  SKIP  ${c.stageName} — no image mapped yet`)
      skipped++
      continue
    }
    await prisma.contestant.update({ where: { id: c.id }, data: { imageUrl } })
    console.log(`  ✓     ${c.stageName} → ${imageUrl}`)
    updated++
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped (no image yet).`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
