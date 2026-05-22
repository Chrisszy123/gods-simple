import { Queue } from 'bullmq'
import Redis from 'ioredis'

export const VOTE_QUEUE_NAME = 'votes'

export interface VoteJobData {
  paystackRef: string
  contestantId: string
  amountKobo: number
  votes: number
}

// BullMQ requires ioredis — kept separate from the Upstash REST client used by the app
const queueConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const globalForQueue = globalThis as unknown as {
  voteQueue: Queue<VoteJobData> | undefined
}

export const voteQueue: Queue<VoteJobData> =
  globalForQueue.voteQueue ??
  new Queue<VoteJobData>(VOTE_QUEUE_NAME, { connection: queueConnection })

if (process.env.NODE_ENV !== 'production') globalForQueue.voteQueue = voteQueue
