import { NextResponse } from 'next/server'
import { redis, LEADERBOARD_KEY } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const redisData = await redis.zrevrange(LEADERBOARD_KEY, 0, -1, 'WITHSCORES')

    let contestants

    if (redisData.length > 0) {
      const scoreMap: Record<string, number> = {}
      const ids: string[] = []

      for (let i = 0; i < redisData.length; i += 2) {
        ids.push(redisData[i])
        scoreMap[redisData[i]] = parseInt(redisData[i + 1], 10)
      }

      const rows = await prisma.contestant.findMany({
        where: { id: { in: ids } },
      })

      contestants = rows
        .map((c) => ({ ...c, totalVotes: scoreMap[c.id] ?? c.totalVotes }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
    } else {
      contestants = await prisma.contestant.findMany({
        orderBy: { totalVotes: 'desc' },
      })
    }

    const ranked = contestants.map((c, i) => ({ ...c, rank: i + 1 }))

    const round = await prisma.votingRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contestants: ranked, round })
  } catch (err) {
    console.error('[leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
