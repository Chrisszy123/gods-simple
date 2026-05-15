import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PAYSTACK_BASE = 'https://api.paystack.co'

async function req(method: string, path: string, body?: object) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function run() {
  const c = await prisma.contestant.findFirst({ orderBy: { stageName: 'asc' } })
  if (!c) { console.log('No contestants found'); return }

  console.log(`\nContestant: ${c.stageName}`)
  console.log(`Customer code: ${c.paystackCustomerId}`)
  console.log(`Account number: ${c.virtualAccountNumber}\n`)

  // 1. Full customer record
  console.log('=== GET /customer ===')
  const customer = await req('GET', `/customer/${c.paystackCustomerId}`)
  console.log(JSON.stringify(customer.data, null, 2))

  // 2. Full dedicated account record
  console.log('\n=== GET /dedicated_account?customer=... ===')
  const da = await req('GET', `/dedicated_account?customer=${c.paystackCustomerId}`)
  console.log(JSON.stringify(da.data, null, 2))

  // 3. Available providers
  console.log('\n=== GET /dedicated_account/available_providers ===')
  const providers = await req('GET', '/dedicated_account/available_providers')
  console.log(JSON.stringify(providers, null, 2))

  // 4. Try POST deactivate with preferred_bank string
  console.log('\n=== POST /dedicated_account/deactivate (preferred_bank string) ===')
  const r1 = await req('POST', '/dedicated_account/deactivate', {
    account_number: c.virtualAccountNumber,
    preferred_bank: 'wema-bank',
  })
  console.log(JSON.stringify(r1, null, 2))

  // 5. Try DELETE on the dedicated account ID directly
  console.log(`\n=== DELETE /dedicated_account/${customer.data.dedicated_account?.id} ===`)
  const r2 = await req('DELETE', `/dedicated_account/${customer.data.dedicated_account?.id}`)
  console.log(JSON.stringify(r2, null, 2))

  await prisma.$disconnect()
}

run().catch((e) => { console.error(e); process.exit(1) })
