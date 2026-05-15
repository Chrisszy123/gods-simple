import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const GODW_KEY = 'godw_leaderboard'

export async function GET() {
  try {
    const redisData = await redis.zrevrange(GODW_KEY, 0, -1, 'WITHSCORES')

    const allContestants = await prisma.contestant.findMany()

    let contestants

    if (redisData.length > 0) {
      const scoreMap: Record<string, number> = {}
      for (let i = 0; i < redisData.length; i += 2) {
        scoreMap[redisData[i]] = parseInt(redisData[i + 1], 10)
      }

      contestants = allContestants
        .map((c) => ({ ...c, godwVoteCount: scoreMap[c.id] ?? c.godwVoteCount }))
        .sort((a, b) => b.godwVoteCount - a.godwVoteCount)
    } else {
      contestants = allContestants.sort((a, b) => b.godwVoteCount - a.godwVoteCount)
    }

    const ranked = contestants.map((c, i) => ({ ...c, rank: i + 1 }))

    const round = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contestants: ranked, round })
  } catch (err) {
    console.error('[godw/leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
