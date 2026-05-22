import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { updateCustomer } from '../lib/paystack'

const prisma = new PrismaClient()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function run() {
  const contestants = await prisma.contestant.findMany({
    select: { id: true, stageName: true, paystackCustomerId: true },
  })

  console.log(`Updating Paystack display names for ${contestants.length} contestants...\n`)

  for (const c of contestants) {
    try {
      process.stdout.write(`⏳ ${c.stageName}... `)
      await updateCustomer(c.paystackCustomerId, {
        first_name: 'Gods',
        last_name: c.stageName,
      })
      console.log('✅')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`❌ FAILED — ${msg}`)
    }

    await sleep(500)
  }

  console.log('\nDone.')
  await prisma.$disconnect()
}

run().catch((e) => { console.error(e); process.exit(1) })
