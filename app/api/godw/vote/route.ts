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
  // x-forwarded-for[0] is user-controlled and trivially spoofed — never trust it as the sole source.
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  // Fallback: rightmost entry in x-forwarded-for is added by the most-trusted proxy, not the client.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[ips.length - 1].trim()
  }
  return '127.0.0.1'
}

export async function POST(req: NextRequest) {
  try {
    const { contestantId } = await req.json()
    if (!contestantId || typeof contestantId !== 'string') {
      return NextResponse.json({ error: 'invalid_request', message: 'contestantId is required' }, { status: 400 })
    }

    const ip = getIp(req)

    const activeRound = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // ── Layer 1: HTTP-only cookie ────────────────────────────────────────────
    // Set by the server after a successful vote. Survives IP rotation and VPN
    // switches because it lives in the browser, not tied to the network address.
    if (activeRound) {
      const cookieVote = req.cookies.get(`godw_round_${activeRound.id}`)
      if (cookieVote) {
        return NextResponse.json(
          { error: 'round_vote_used', message: 'You have already used your vote this round' },
          { status: 409 }
        )
      }
    }

    // Reject vote if contestant is not in this week's lineup
    if (activeRound && activeRound.contestantIds.length > 0 && !activeRound.contestantIds.includes(contestantId)) {
      return NextResponse.json(
        { error: 'not_in_round', message: 'This contestant is not in the current GODW round' },
        { status: 403 }
      )
    }

    // ── Layer 2: Atomic Redis lock ───────────────────────────────────────────
    // SET NX is atomic — only one concurrent request per IP per round can win.
    // This eliminates the race-condition window between the DB read and write.
    if (activeRound) {
      const lockKey = `godw_vote_lock:${activeRound.id}:${hashIp(ip)}`
      const ttl = Math.max(3600, Math.floor((new Date(activeRound.endsAt).getTime() - Date.now()) / 1000))
      const acquired = await redis.set(lockKey, contestantId, { nx: true, ex: ttl })
      if (!acquired) {
        return NextResponse.json(
          { error: 'round_vote_used', message: 'You have already used your vote this round' },
          { status: 409 }
        )
      }
    }

    // ── Layer 3: DB unique constraint ────────────────────────────────────────
    // Belt-and-suspenders — catches any edge case that slips past layers 1 & 2.
    const existingVote = await prisma.godwVote.findUnique({
      where: { contestantId_ipAddress: { contestantId, ipAddress: ip } },
    })
    if (existingVote) {
      return NextResponse.json(
        { error: 'already_voted', message: 'You have already voted for this contestant' },
        { status: 409 }
      )
    }

    const [, updated] = await prisma.$transaction([
      prisma.godwVote.create({ data: { contestantId, ipAddress: ip } }),
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

    // Plant the HTTP-only cookie on successful vote
    if (activeRound) {
      const cookieTtl = Math.max(3600, Math.floor((new Date(activeRound.endsAt).getTime() - Date.now()) / 1000))
      response.cookies.set(`godw_round_${activeRound.id}`, contestantId, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: cookieTtl,
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return response
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'already_voted', message: 'You have already voted for this contestant' },
        { status: 409 }
      )
    }
    console.error('[godw/vote]', err)
    return NextResponse.json({ error: 'internal_error', message: 'Something went wrong' }, { status: 500 })
  }
}
