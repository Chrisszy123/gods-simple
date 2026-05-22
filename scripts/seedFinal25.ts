import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createCustomer, createDedicatedAccount, fetchCustomer, updateCustomer } from '../lib/paystack'

const prisma = new PrismaClient()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const CONTESTANTS = [
  { name: 'Nwachukwu Michael Chibuikem', stageName: '12 Men',             email: 'blaqdance@gmail.com',                  phone: '08134622313' },
  { name: 'Alfred Greatness Umeaku',     stageName: 'Alfred Greatness',   email: 'umeakualfred25@gmail.com',             phone: '09060496432' },
  { name: 'Anasemi Gomba-Obe',           stageName: 'Anasemi',            email: 'anasemig@gmail.com',                   phone: '08180816959' },
  { name: 'Arigem',                      stageName: 'Arigem',             email: 'arigem17@gmail.com',                   phone: '07043829339' },
  { name: 'Azu Expressions',             stageName: 'Azu Expressions',    email: 'azunwomrmiracle@gmail.com',            phone: '08133619191' },
  { name: 'Baritorn',                    stageName: 'Baritorn',           email: 'aberefavour1@gmail.com',               phone: '08164531003' },
  { name: 'Jumbo Clinton',               stageName: 'Clinton',            email: 'jumbotamunoiprinye247@gmail.com',      phone: '08120250405' },
  { name: 'Collins Emmanuel Okojie',     stageName: 'Collins Sax',        email: 'collinssax120@gmail.com',              phone: '09168279786' },
  { name: 'Cyprian Emmanuella',          stageName: 'Emmanuella',         email: 'riannuella@gmail.com',                 phone: '09134822357' },
  { name: 'Daniel Ebube Nwakanma',       stageName: 'Deeplydan',          email: 'danielebube.n.00@gmail.com',           phone: '09049793433' },
  { name: 'Destiny Rex Igiri',           stageName: 'Thelordsmouthpiece', email: 'rexigiridestiny@gmail.com',            phone: '09161270411' },
  { name: 'Emmanuel Elebachi',           stageName: 'Elebachi',           email: 'emmanuelelebachi24@gmail.com',         phone: '09160187906' },
  { name: 'Samuel Omojevu',             stageName: 'Elite Empire',       email: 'sammysamomojevu@gmail.com',            phone: '08104523723' },
  { name: 'Eric Adediji',               stageName: 'Eric',               email: 'ericadediji325@gmail.com',             phone: '09079155498' },
  { name: 'GAGS',                        stageName: 'GAGS',               email: 'bolugags@gmail.com',                   phone: '08090553999' },
  { name: 'Hero Ogeki',                  stageName: 'Hero',               email: 'evansogeki@gmail.com',                 phone: '08021415524' },
  { name: 'Kingsley C. Esomonu',         stageName: 'Rhythdm',            email: 'kingzchibyke@gmail.com',               phone: '09032879953' },
  { name: 'Sophia Aniekan',             stageName: 'Sophiya',            email: 'aniekansophia@gmail.com',              phone: '08022873448' },
  { name: 'Zamani Art',                  stageName: 'Street Brothers',    email: 'streetbrothers414@gmail.com',          phone: '08164632522' },
  { name: 'David Yakubu',               stageName: 'Symphonix',          email: 'kayakubu03@gmail.com',                 phone: '07056963938' },
  { name: 'Saviour James Emmanuel',      stageName: 'Team Unlimited',     email: 'saviouremmanuel182@gmail.com',         phone: '09166176063' },
  { name: 'Asuquo Praise Peter',         stageName: 'Reiy',               email: 'pearlypeter2008@gmail.com',            phone: '09167696909' },
  { name: 'Ugochukwu Nwinya',           stageName: 'Ugochukwu Nwinya',   email: 'ugochukwunwinya@gmail.com',            phone: '09046570013' },
  { name: 'Victor Anozie',              stageName: 'Vaxxie',             email: 'anozie261@gmail.com',                  phone: '08115320752' },
  { name: 'Manuel Ace',                  stageName: 'Manuel Ace',         email: 'emmanuelpe838@gmail.com',              phone: '08051543160' },
]

async function getOrCreateCustomer(email: string, firstName: string, lastName: string, phone: string) {
  // Always try to fetch first — previous failed runs may have left customers without phone
  try {
    const existing = await fetchCustomer(email)
    const code = existing.data.customer_code
    await updateCustomer(code, { phone })
    console.log(`(found existing customer, updated phone)`)
    return code
  } catch {
    // Customer doesn't exist yet — create fresh with phone
  }

  const res = await createCustomer(email, firstName, lastName, phone)
  return res.data.customer_code
}

async function seed() {
  console.log(`Seeding ${CONTESTANTS.length} contestants into production DB...\n`)

  for (const c of CONTESTANTS) {
    const existing = await prisma.contestant.findFirst({ where: { stageName: c.stageName } })
    if (existing) {
      console.log(`⏭️  Skip  ${c.stageName} (already in DB — ${existing.virtualAccountNumber})`)
      await sleep(500)
      continue
    }

    const parts = c.name.split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || firstName

    try {
      process.stdout.write(`⏳ ${c.stageName}... `)

      const customerCode = await getOrCreateCustomer(c.email, firstName, lastName, c.phone)

      const accountRes = await createDedicatedAccount(customerCode)
      const { account_number, bank } = accountRes.data

      await prisma.contestant.create({
        data: {
          name:                 c.name,
          stageName:            c.stageName,
          imageUrl:             null,
          paystackCustomerId:   customerCode,
          virtualAccountNumber: account_number,
          virtualAccountBank:   bank.name,
        },
      })

      console.log(`✅  ${account_number} (${bank.name})`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`❌  FAILED — ${msg}`)
    }

    await sleep(1500)
  }

  console.log('\nDone.')
  await prisma.$disconnect()
}

seed()
