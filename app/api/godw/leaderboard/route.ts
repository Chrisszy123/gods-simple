import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const GODW_KEY = 'godw_leaderboard'

export async function GET() {
  try {
    const round = await prisma.godwRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const allowedIds = round?.contestantIds ?? []

    // Compute effective frozen IDs: only those whose freeze hasn't expired yet
    const now = new Date()
    const activeFreezes = round
      ? await prisma.godwFreeze.findMany({
          where: { roundId: round.id, frozenUntil: { gt: now } },
        })
      : []
    const frozenContestantIds = activeFreezes.map((f) => f.contestantId)
    const freezeExpiries: Record<string, string> = {}
    for (const f of activeFreezes) freezeExpiries[f.contestantId] = f.frozenUntil.toISOString()

    const redisData = await redis.zrange(GODW_KEY, 0, -1, { rev: true, withScores: true })

    const roundContestants = await prisma.contestant.findMany({
      where: allowedIds.length > 0 ? { id: { in: allowedIds } } : undefined,
    })

    let contestants

    if (redisData.length > 0) {
      const scoreMap: Record<string, number> = {}
      for (let i = 0; i < redisData.length; i += 2) {
        scoreMap[redisData[i] as string] = Number(redisData[i + 1])
      }

      contestants = roundContestants
        .map((c) => ({ ...c, godwVoteCount: scoreMap[c.id] ?? c.godwVoteCount }))
        .sort((a, b) => b.godwVoteCount - a.godwVoteCount)
    } else {
      contestants = roundContestants.sort((a, b) => b.godwVoteCount - a.godwVoteCount)
    }

    const ranked = contestants.map((c, i) => ({ ...c, rank: i + 1 }))

    return NextResponse.json({ contestants: ranked, round, frozenContestantIds, freezeExpiries })
  } catch (err) {
    console.error('[godw/leaderboard]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
