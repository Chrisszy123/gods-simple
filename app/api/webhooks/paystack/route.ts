import { type NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis, LEADERBOARD_KEY } from '@/lib/redis'
import { pusherServer } from '@/lib/pusher'
import { GODW_NAMES } from '@/lib/godw'

export const dynamic = 'force-dynamic'

// GODW: ₦100 = 1 vote | Eviction: ₦200 = 1 vote
const GODW_KOBO_PER_VOTE     = 10_000
const EVICTION_KOBO_PER_VOTE = 20_000

function koboPerVote(stageName: string): number {
  const isGodw = GODW_NAMES.some(n => n.trim().toUpperCase() === stageName.trim().toUpperCase())
  return isGodw ? GODW_KOBO_PER_VOTE : EVICTION_KOBO_PER_VOTE
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // ── 1. Guard: secret key must be configured ──────────────────────────────
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error('[webhook] PAYSTACK_SECRET_KEY is not set — rejecting all events')
    return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 })
  }

  // ── 2. Verify Paystack signature ─────────────────────────────────────────
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    console.warn('[webhook] Invalid signature — rejected')
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  }

  // ── 3. Parse and log every event for debugging ───────────────────────────
  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    console.error('[webhook] Failed to parse JSON body')
    return NextResponse.json({ message: 'Bad JSON' }, { status: 400 })
  }

  const eventType = event.event as string
  console.log(`[webhook] Received event: ${eventType}`)

  // ── 4. Only handle successful charges ────────────────────────────────────
  if (eventType !== 'charge.success') {
    console.log(`[webhook] Ignored event type: ${eventType}`)
    return NextResponse.json({ message: 'OK' })
  }

  // ── 5. Safely extract fields — NUBAN and card payloads can differ ─────────
  try {
    const data     = event.data as Record<string, unknown>
    const channel  = data.channel as string | undefined
    const amount   = data.amount as number
    const reference = data.reference as string

    // customer_code lives at data.customer.customer_code for both card + NUBAN
    const customerObj  = data.customer as Record<string, unknown> | undefined
    const customerCode = customerObj?.customer_code as string | undefined

    console.log(`[webhook] channel=${channel} amount=${amount} reference=${reference} customerCode=${customerCode}`)

    if (!customerCode) {
      console.warn('[webhook] No customer_code in payload — cannot match contestant')
      console.warn('[webhook] Full data:', JSON.stringify(data, null, 2))
      return NextResponse.json({ message: 'No customer code' })
    }

    // ── 6. Find contestant by Paystack customer code ─────────────────────────
    const contestant = await prisma.contestant.findUnique({
      where: { paystackCustomerId: customerCode },
    })

    if (!contestant) {
      console.warn(`[webhook] No contestant found for customer_code: ${customerCode}`)
      return NextResponse.json({ message: 'Contestant not found' })
    }

    // ── 7. Idempotency — never double-count a reference ──────────────────────
    const alreadyProcessed = await prisma.transaction.findUnique({
      where: { paystackRef: reference },
      select: { id: true },
    })

    if (alreadyProcessed) {
      console.log(`[webhook] Already processed reference: ${reference}`)
      return NextResponse.json({ message: 'Already processed' })
    }

    // ── 8. Calculate votes (rate depends on GODW vs Eviction) ─────────────────
    const rate  = koboPerVote(contestant.stageName)
    const votes = Math.floor(amount / rate)

    console.log(`[webhook] rate=${rate} kobo/vote for ${contestant.stageName} → ${votes} vote(s)`)

    if (votes < 1) {
      console.warn(`[webhook] Amount ${amount} kobo is below minimum (${rate} kobo per vote) — no votes awarded`)
      return NextResponse.json({ message: 'Amount too low for a vote' })
    }

    // ── 9. Persist: transaction + updated vote count ─────────────────────────
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

    // ── 10. Update Redis leaderboard (non-fatal) ──────────────────────────────
    try {
      await redis.zincrby(LEADERBOARD_KEY, votes, contestant.id)
    } catch (err) {
      console.error('[webhook] Redis update failed (non-fatal):', err)
    }

    // ── 11. Broadcast via Pusher (non-fatal) ──────────────────────────────────
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

    console.log(`[webhook] ✅ +${votes} vote${votes !== 1 ? 's' : ''} → ${contestant.stageName} (₦${amount / 100}, ref: ${reference})`)
    return NextResponse.json({ message: 'OK' })

  } catch (err) {
    console.error('[webhook] Unhandled error processing charge.success:', err)
    // Return 200 so Paystack doesn't keep retrying a permanently broken event.
    // Change to 500 if you WANT Paystack to retry on transient DB/Redis errors.
    return NextResponse.json({ message: 'Error — logged' }, { status: 500 })
  }
}
