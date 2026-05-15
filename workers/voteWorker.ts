import 'dotenv/config'
import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import Pusher from 'pusher'
import { VOTE_QUEUE_NAME, VoteJobData } from '../lib/queue'

const LEADERBOARD_KEY = 'leaderboard'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const prisma = new PrismaClient()

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

const worker = new Worker<VoteJobData>(
  VOTE_QUEUE_NAME,
  async (job) => {
    const { paystackRef, contestantId, amountKobo, votes } = job.data

    await prisma.transaction.create({
      data: {
        paystackRef,
        contestantId,
        amountKobo,
        votes,
        status: 'success',
      },
    })

    const updated = await prisma.contestant.update({
      where: { id: contestantId },
      data: { totalVotes: { increment: votes } },
    })

    await connection.zincrby(LEADERBOARD_KEY, votes, contestantId)

    await pusher.trigger('leaderboard', 'VOTE_UPDATE', {
      contestantId,
      newTotalVotes: updated.totalVotes,
      delta: votes,
    })

    console.log(`[vote] +${votes} votes for ${contestantId} (ref: ${paystackRef})`)
  },
  { connection }
)

worker.on('failed', (job, err) => {
  console.error(`[vote] Job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[vote] Worker error:', err.message)
})

console.log('Vote worker started, listening for jobs...')
