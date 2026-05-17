import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'godw')).digest('hex').slice(0, 16)
}

function getIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[ips.length - 1].trim()
  }
  return '127.0.0.1'
}

export async function GET(req: NextRequest) {
  try {
    const ip = getIp(req)

    const activeRound = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!activeRound) {
      return NextResponse.json({ hasVoted: false, votedForContestantId: null })
    }

    // 1. Cookie — fastest, persists across IP changes
    const cookieVote = req.cookies.get(`godw_round_${activeRound.id}`)
    if (cookieVote) {
      return NextResponse.json({ hasVoted: true, votedForContestantId: cookieVote.value })
    }

    // 2. IP Redis lock — catches same IP without cookie
    const lockKey = `godw_vote_lock:${activeRound.id}:${hashIp(ip)}`
    const redisVote = await redis.get<string>(lockKey)
    if (redisVote) {
      return NextResponse.json({ hasVoted: true, votedForContestantId: redisVote })
    }

    // 3. DB — permanent source of truth, keyed by IP + roundId
    const vote = await prisma.godwVote.findUnique({
      where: { ipAddress_roundId: { ipAddress: ip, roundId: activeRound.id } },
    })

    return NextResponse.json({
      hasVoted: !!vote,
      votedForContestantId: vote?.contestantId ?? null,
    })
  } catch (err) {
    console.error('[godw/my-vote]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
