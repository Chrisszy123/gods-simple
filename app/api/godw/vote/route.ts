import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { pusherServer } from '@/lib/pusher'

export const dynamic = 'force-dynamic'

const GODW_KEY = 'godw_leaderboard'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'godw')).digest('hex').slice(0, 16)
}

function getIp(req: NextRequest): string {
  // x-real-ip is set by Vercel's infrastructure and cannot be overridden by the client.
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  // Rightmost x-forwarded-for entry is the most-trusted proxy, not the client.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[ips.length - 1].trim()
  }
  return '127.0.0.1'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contestantId, fingerprint } = body as { contestantId?: string; fingerprint?: string }
    if (!contestantId || typeof contestantId !== 'string') {
      return NextResponse.json({ error: 'invalid_request', message: 'contestantId is required' }, { status: 400 })
    }

    const ip = getIp(req)

    const activeRound = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // Reject if no active round
    if (!activeRound) {
      return NextResponse.json({ error: 'no_active_round', message: 'No active voting round' }, { status: 403 })
    }

    // Reject if round has ended — prevents 1-hour TTL loophole when endsAt is in the past
    if (new Date(activeRound.endsAt) < new Date()) {
      return NextResponse.json({ error: 'round_ended', message: 'This voting round has ended' }, { status: 403 })
    }

    // ── Layer 1: HTTP-only cookie ────────────────────────────────────────────
    // Survives IP rotation and VPN switches — tied to the browser, not the network.
    const cookieVote = req.cookies.get(`godw_round_${activeRound.id}`)
    if (cookieVote) {
      return NextResponse.json(
        { error: 'round_vote_used', message: 'You have already used your vote this round' },
        { status: 409 }
      )
    }

    // Reject if contestant is not in this round's lineup
    if (activeRound.contestantIds.length > 0 && !activeRound.contestantIds.includes(contestantId)) {
      return NextResponse.json(
        { error: 'not_in_round', message: 'This contestant is not in the current GODW round' },
        { status: 403 }
      )
    }

    // Hard-block frozen contestants — expiry checked live, no manual unfreeze needed
    if (activeRound.frozenContestantIds.includes(contestantId)) {
      const freeze = await prisma.godwFreeze.findUnique({
        where: { contestantId_roundId: { contestantId, roundId: activeRound.id } },
      })
      if (freeze && freeze.frozenUntil > new Date()) {
        return NextResponse.json(
          { error: 'contestant_frozen', message: 'This contestant has been disqualified from voting' },
          { status: 403 }
        )
      }
    }

    // ── Layer 2: Atomic Redis lock (IP + round) ──────────────────────────────
    // SET NX is atomic — only one request per IP per round wins.
    // TTL is always the full remaining round duration, never less.
    const roundMs = new Date(activeRound.endsAt).getTime() - Date.now()
    const lockTtl = Math.ceil(roundMs / 1000)
    const lockKey = `godw_vote_lock:${activeRound.id}:${hashIp(ip)}`
    const acquired = await redis.set(lockKey, contestantId, { nx: true, ex: lockTtl })
    if (!acquired) {
      return NextResponse.json(
        { error: 'round_vote_used', message: 'You have already used your vote this round' },
        { status: 409 }
      )
    }

    // ── Layer 3: DB unique constraint (IP + roundId) ─────────────────────────
    // One vote per IP per round — regardless of contestant or cookie state.
    // This is the permanent source of truth that survives Redis flushes.
    const existingVote = await prisma.godwVote.findUnique({
      where: { ipAddress_roundId: { ipAddress: ip, roundId: activeRound.id } },
    })
    if (existingVote) {
      return NextResponse.json(
        { error: 'round_vote_used', message: 'You have already used your vote this round' },
        { status: 409 }
      )
    }

    const [, updated] = await prisma.$transaction([
      prisma.godwVote.create({
        data: { contestantId, roundId: activeRound.id, ipAddress: ip, fingerprint: fingerprint ?? null },
      }),
      prisma.contestant.update({
        where: { id: contestantId },
        data: { godwVoteCount: { increment: 1 } },
      }),
    ])

    await redis.zincrby(GODW_KEY, 1, contestantId)

    if (pusherServer) {
      await pusherServer.trigger('godw-leaderboard', 'GODW_VOTE_UPDATE', {
        contestantId,
        newGodwVotes: updated.godwVoteCount,
        voterIp: hashIp(ip),
      })
    }

    const response = NextResponse.json({ success: true, newVoteCount: updated.godwVoteCount })

    // Plant the HTTP-only cookie — TTL exactly matches the round's remaining time
    const cookieTtl = Math.ceil(roundMs / 1000)
    response.cookies.set(`godw_round_${activeRound.id}`, contestantId, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: cookieTtl,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'round_vote_used', message: 'You have already used your vote this round' },
        { status: 409 }
      )
    }
    console.error('[godw/vote]', err)
    return NextResponse.json({ error: 'internal_error', message: 'Something went wrong' }, { status: 500 })
  }
}
