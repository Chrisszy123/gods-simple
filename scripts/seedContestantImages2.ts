import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map: stageName (case-insensitive match) → public image path
// Spaces in filenames are encoded as %20 for safe URL usage
const IMAGE_MAP: Record<string, string> = {
  'symphonix':          '/images/GOTS/SYMPHONIX.jpg',
  'gags':               '/images/GOTS/GAGS.jpg',
  'hero':               '/images/GOTS/HERO.jpg',
  'team unlimited':     '/images/GOTS/TEAM%20UNLIMITED.jpg',
  'thelordsmouthpiece': '/images/GOTS/THELORDSMOUTHPIECE.jpg',
  'vaxxie':             '/images/GOTS/VAXXIE.jpg',
  'clinton':            '/images/GOTS/CLINTON.jpg',
  'deeplydan':          '/images/GOTS/DEEPLYDAN.jpg',
  'elite empire':       '/images/GOTS/ELITE%20EMPIRE.jpg',
  'eric':               '/images/GOTS/ERIC.jpg',
  'ugochukwu nwinya':   '/images/GOTS/UGOCHUKWU%20NWINYA.jpg',
  'arigem':             '/images/GOTS/ARIGEM.jpg',
  'manuel ace':         '/images/GOTS/MANUEL%20ACE.jpg',
  'azu expressions':    '/images/GOTS/AZUEXPRESSION.jpg',
  'reiy':               '/images/GOTS/REIY.jpg',
  'baritorn':           '/images/GOTS/BARITORN.jpg',
  'street brothers':    '/images/GOTS/STREET%20BROTHERS.jpg',
  'rhythdm':            '/images/GOTS/RHYTHM.jpg',
  'sophiya':            '/images/GOTS/SOPHIYA.jpg',
  '12 men':             '/images/GOTS/12%20MEN.jpg',
  'alfred greatness':   '/images/GOTS/ALFRED%20GREATNESS.jpg',
  'anasemi':            '/images/GOTS/ANASEMI.jpg',
  'collins sax':        '/images/GOTS/COLLINS%20SAX.jpg',
  'elebachi':           '/images/GOTS/ELEBACHI%20EMMANUEL.jpg',
  'emmanuella':         '/images/GOTS/EMMANUELLA.jpg',
}

async function run() {
  const contestants = await prisma.contestant.findMany({
    select: { id: true, stageName: true, imageUrl: true },
  })

  let updated = 0
  let skipped = 0
  let notFound: string[] = []

  for (const c of contestants) {
    const key = c.stageName.trim().toLowerCase()
    const newUrl = IMAGE_MAP[key]

    if (!newUrl) {
      notFound.push(c.stageName)
      continue
    }

    if (c.imageUrl === newUrl) {
      skipped++
      continue
    }

    await prisma.contestant.update({
      where: { id: c.id },
      data: { imageUrl: newUrl },
    })

    console.log(`  ✓ ${c.stageName}  →  ${newUrl}`)
    updated++
  }

  console.log(`\n✅ Updated: ${updated} | Already correct: ${skipped}`)
  if (notFound.length) {
    console.warn(`⚠  No image mapping for: ${notFound.join(', ')}`)
  }

  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
