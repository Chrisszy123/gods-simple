import { type NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis, LEADERBOARD_KEY } from '@/lib/redis'
import { pusherServer } from '@/lib/pusher'

// 1 vote = ₦100 = 10,000 kobo
const KOBO_PER_VOTE = 10_000

export async function POST(req: NextRequest) {
  const body = await req.text()

  // ── 1. Verify Paystack signature ────────────────────────────────────────
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    console.warn('[webhook] Invalid signature — rejected')
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // ── 2. Only handle successful charges ───────────────────────────────────
  if (event.event !== 'charge.success') {
    return NextResponse.json({ message: 'OK' })
  }

  const { amount, reference, customer } = event.data as {
    amount: number
    reference: string
    customer: { customer_code: string; email: string }
  }

  // ── 3. Find contestant by their Paystack customer code ──────────────────
  const contestant = await prisma.contestant.findUnique({
    where: { paystackCustomerId: customer.customer_code },
  })

  if (!contestant) {
    console.warn('[webhook] No contestant for customer:', customer.customer_code)
    return NextResponse.json({ message: 'Contestant not found' })
  }

  // ── 4. Idempotency — never double-count a reference ─────────────────────
  const alreadyProcessed = await prisma.transaction.findUnique({
    where: { paystackRef: reference },
    select: { id: true },
  })

  if (alreadyProcessed) {
    return NextResponse.json({ message: 'Already processed' })
  }

  // ── 5. Calculate votes ───────────────────────────────────────────────────
  const votes = Math.floor(amount / KOBO_PER_VOTE)

  if (votes < 1) {
    console.warn(`[webhook] Amount ${amount} kobo is below minimum (${KOBO_PER_VOTE} kobo)`)
    return NextResponse.json({ message: 'Amount too low for a vote' })
  }

  // ── 6. Persist: transaction record + updated vote count ─────────────────
  const [, updated] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        paystackRef:  reference,
        contestantId: contestant.id,
        amountKobo:   amount,
        votes,
        status:       'success',
      },
    }),
    prisma.contestant.update({
      where: { id: contestant.id },
      data:  { totalVotes: { increment: votes } },
    }),
  ])

  // ── 7. Update Redis leaderboard (non-fatal if Redis is down) ────────────
  try {
    await redis.zincrby(LEADERBOARD_KEY, votes, contestant.id)
  } catch (err) {
    console.error('[webhook] Redis update failed (non-fatal):', err)
  }

  // ── 8. Broadcast vote update via Pusher ──────────────────────────────────
  if (pusherServer) {
    try {
      await pusherServer.trigger('leaderboard', 'VOTE_UPDATE', {
        contestantId:  contestant.id,
        newTotalVotes: updated.totalVotes,
        delta:         votes,
      })
    } catch (err) {
      console.error('[webhook] Pusher trigger failed (non-fatal):', err)
    }
  }

  console.log(`[webhook] +${votes} vote${votes > 1 ? 's' : ''} → ${contestant.stageName}  (₦${amount / 100}, ref: ${reference})`)
  return NextResponse.json({ message: 'OK' })
}
