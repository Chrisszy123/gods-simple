import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { pusherServer } from '@/lib/pusher'

const GODW_KEY = 'godw_leaderboard'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'godw')).digest('hex').slice(0, 16)
}

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
}

export async function POST(req: NextRequest) {
  try {
    const { contestantId } = await req.json()
    if (!contestantId || typeof contestantId !== 'string') {
      return NextResponse.json({ error: 'invalid_request', message: 'contestantId is required' }, { status: 400 })
    }

    const ip = getIp(req)

    const existingVoteForContestant = await prisma.godwVote.findUnique({
      where: { contestantId_ipAddress: { contestantId, ipAddress: ip } },
    })

    if (existingVoteForContestant) {
      return NextResponse.json(
        { error: 'already_voted', message: 'You have already voted for this contestant' },
        { status: 409 }
      )
    }

    const activeRound = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (activeRound) {
      const roundVote = await prisma.godwVote.findFirst({
        where: {
          ipAddress: ip,
          createdAt: { gte: activeRound.startsAt, lte: activeRound.endsAt },
        },
      })

      if (roundVote) {
        return NextResponse.json(
          { error: 'round_vote_used', message: 'You have already used your vote this round' },
          { status: 409 }
        )
      }
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

    return NextResponse.json({ success: true, newVoteCount: updated.godwVoteCount })
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        { error: 'already_voted', message: 'You have already voted for this contestant' },
        { status: 409 }
      )
    }
    console.error('[godw/vote]', err)
    return NextResponse.json({ error: 'internal_error', message: 'Something went wrong' }, { status: 500 })
  }
}
