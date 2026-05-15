import { type NextRequest } from 'next/server'
import { redis, LEADERBOARD_KEY } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface LeaderboardData {
  contestants: Array<{
    id: string
    stageName: string
    name: string
    imageUrl: string | null
    totalVotes: number
    rank: number
  }>
  round: {
    id: string
    name: string
    endsAt: string
    isActive: boolean
    winnerId: string | null
  } | null
}

async function fetchLeaderboard(): Promise<LeaderboardData | null> {
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
      const rows = await prisma.contestant.findMany({ where: { id: { in: ids } } })
      contestants = rows
        .map((c) => ({ ...c, totalVotes: scoreMap[c.id] ?? c.totalVotes }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
    } else {
      contestants = await prisma.contestant.findMany({ orderBy: { totalVotes: 'desc' } })
    }

    const ranked = contestants.map((c, i) => ({ ...c, rank: i + 1 }))

    const round = await prisma.votingRound.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return {
      contestants: ranked,
      round: round
        ? { ...round, endsAt: round.endsAt.toISOString() }
        : null,
    }
  } catch {
    return null
  }
}

function fingerprint(data: LeaderboardData): string {
  return data.contestants.map((c) => `${c.id}:${c.totalVotes}`).join(',')
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          closed = true
        }
      }

      const sendUpdate = (data: LeaderboardData) => {
        enqueue(`event: update\ndata: ${JSON.stringify(data)}\n\n`)
      }

      const sendPing = () => {
        enqueue(': ping\n\n')
      }

      let lastFingerprint = ''

      const check = async () => {
        if (closed) return
        const data = await fetchLeaderboard()
        if (!data) return
        const fp = fingerprint(data)
        if (fp !== lastFingerprint) {
          lastFingerprint = fp
          sendUpdate(data)
        }
      }

      // Push current state immediately on connect
      await check()

      // Poll every 2 seconds and push only when data changed
      const pollId = setInterval(check, 2000)

      // Keep TCP connection alive through proxies
      const pingId = setInterval(sendPing, 20_000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(pollId)
        clearInterval(pingId)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx response buffering
    },
  })
}
