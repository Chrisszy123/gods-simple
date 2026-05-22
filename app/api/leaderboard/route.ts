import { NextResponse } from 'next/server'
import { redis, LEADERBOARD_KEY } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

export async function GET() {
  try {
    const redisData = await redis.zrange(LEADERBOARD_KEY, 0, -1, { rev: true, withScores: true })

    // Always fetch all contestants from DB — Redis is only a score cache, not a filter
    const allRows = await prisma.contestant.findMany({
      select: {
        id: true,
        stageName: true,
        name: true,
        imageUrl: true,
        totalVotes: true,
        godwVoteCount: true,
        virtualAccountNumber: true,
        virtualAccountBank: true,
      },
    })

    const scoreMap: Record<string, number> = {}
    for (let i = 0; i < redisData.length; i += 2) {
      const id = redisData[i] as string
      scoreMap[id] = Number(redisData[i + 1])
    }

    const contestants = allRows
      .map((c) => ({ ...c, totalVotes: scoreMap[c.id] ?? c.totalVotes }))
      .sort((a, b) => b.totalVotes - a.totalVotes)

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
