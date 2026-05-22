import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createCustomer, createDedicatedAccount } from '../lib/paystack'

const prisma = new PrismaClient()

const CONTESTANTS = [
  { name: 'Adaeze Okonkwo', stageName: 'Ada Divine', imageUrl: 'https://i.pravatar.cc/150?u=ada' },
  { name: 'Chukwuemeka Nwosu', stageName: 'King Emeka', imageUrl: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Fatima Al-Hassan', stageName: 'Fatima Fierce', imageUrl: 'https://i.pravatar.cc/150?u=fatima' },
  { name: 'Babatunde Adeleke', stageName: 'Baba Thunder', imageUrl: 'https://i.pravatar.cc/150?u=baba' },
  { name: 'Ngozi Ikechukwu', stageName: 'Ngozi Gold', imageUrl: 'https://i.pravatar.cc/150?u=ngozi' },
  { name: 'Seun Olawale', stageName: 'Seun Blazer', imageUrl: 'https://i.pravatar.cc/150?u=seun' },
  { name: 'Amaka Obi', stageName: 'Queen Amaka', imageUrl: 'https://i.pravatar.cc/150?u=amaka' },
  { name: 'Taiwo Adesanya', stageName: 'Twin Fire', imageUrl: 'https://i.pravatar.cc/150?u=taiwo' },
]

async function seed() {
  console.log('Starting contestant seeding...\n')

  for (const contestant of CONTESTANTS) {
    const nameParts = contestant.name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')
    const emailSlug = contestant.stageName.toLowerCase().replace(/\s+/g, '')
    const email = `${emailSlug}@godsofthestage.com`

    const existing = await prisma.contestant.findFirst({
      where: { stageName: contestant.stageName },
    })

    if (existing) {
      console.log(`⏭️  Skipping ${contestant.stageName} (already exists — account: ${existing.virtualAccountNumber})`)
      continue
    }

    try {
      console.log(`Creating customer for ${contestant.stageName}...`)
      const customerResponse = await createCustomer(email, firstName, lastName)
      const customerCode = customerResponse.data.customer_code

      console.log(`Creating virtual account for ${contestant.stageName}...`)
      const accountResponse = await createDedicatedAccount(customerCode)
      const { account_number, bank } = accountResponse.data

      await prisma.contestant.create({
        data: {
          name: contestant.name,
          stageName: contestant.stageName,
          imageUrl: contestant.imageUrl,
          paystackCustomerId: customerCode,
          virtualAccountNumber: account_number,
          virtualAccountBank: bank.name,
        },
      })

      console.log(`✅ ${contestant.stageName} — Account: ${account_number} (${bank.name})\n`)
    } catch (err) {
      console.error(`❌ Failed to seed ${contestant.stageName}:`, err)
    }
  }

  console.log('Seeding complete.')
  await prisma.$disconnect()
}

seed()
