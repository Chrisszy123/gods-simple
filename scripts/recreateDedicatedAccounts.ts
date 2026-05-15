import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  fetchDedicatedAccount,
  unassignDedicatedAccount,
  updateCustomer,
  createDedicatedAccount,
} from '../lib/paystack'

const prisma = new PrismaClient()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function run() {
  const contestants = await prisma.contestant.findMany({
    select: { id: true, stageName: true, paystackCustomerId: true, virtualAccountNumber: true },
    orderBy: { stageName: 'asc' },
  })

  console.log(`\nRecreating dedicated accounts for ${contestants.length} contestants.\n`)

  let success = 0
  let failed = 0

  for (const c of contestants) {
    console.log(`⏳ ${c.stageName}`)

    try {
      // 1. Fetch & unassign existing dedicated account (skip if already gone)
      process.stdout.write(`   → Fetching dedicated account... `)
      const daRes = await fetchDedicatedAccount(c.paystackCustomerId)
      const da = daRes.data?.[0]
      if (da && da.account_number) {
        console.log(`id=${da.id}, account=${da.account_number}`)
        await sleep(500)
        process.stdout.write(`   → Unassigning ${da.account_number}... `)
        await unassignDedicatedAccount(da.id)
        console.log('done')
        await sleep(1000)
      } else {
        console.log('already unassigned, skipping')
      }

      // 2. Update customer name
      // Bank format is LASTNAME FIRSTNAME — set last_name=stageName, first_name='.'
      // so bank displays: "GODS/STAGENAME." (dot after name from the '.' first_name)
      process.stdout.write(`   → Updating customer name... `)
      await updateCustomer(c.paystackCustomerId, {
        first_name: '.',
        last_name: c.stageName,
      })
      console.log('done')
      await sleep(1000)

      // 3. Create new dedicated account (picks up updated customer name)
      process.stdout.write(`   → Creating new dedicated account... `)
      const newDa = await createDedicatedAccount(c.paystackCustomerId)
      const { account_number, bank } = newDa.data
      console.log(`${account_number} (${bank.name})`)
      await sleep(500)

      // 4. Update DB with new account number
      await prisma.contestant.update({
        where: { id: c.id },
        data: { virtualAccountNumber: account_number, virtualAccountBank: bank.name },
      })

      console.log(`   ✅ ${c.stageName} → ${account_number}\n`)
      success++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`   ❌ FAILED — ${msg}\n`)
      failed++
    }

    await sleep(2000)
  }

  console.log('─'.repeat(48))
  console.log(`✅ Success: ${success}   ❌ Failed: ${failed}`)
  console.log('─'.repeat(48))

  await prisma.$disconnect()
}

run().catch((e) => { console.error(e); process.exit(1) })
