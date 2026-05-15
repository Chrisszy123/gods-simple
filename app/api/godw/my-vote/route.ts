import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
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

    const vote = await prisma.godwVote.findFirst({
      where: {
        ipAddress: ip,
        createdAt: { gte: activeRound.startsAt, lte: activeRound.endsAt },
      },
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
