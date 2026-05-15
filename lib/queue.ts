import { Queue } from 'bullmq'
import { redis } from './redis'

export const VOTE_QUEUE_NAME = 'votes'

export interface VoteJobData {
  paystackRef: string
  contestantId: string
  amountKobo: number
  votes: number
}

const globalForQueue = globalThis as unknown as {
  voteQueue: Queue<VoteJobData> | undefined
}

export const voteQueue: Queue<VoteJobData> =
  globalForQueue.voteQueue ??
  new Queue<VoteJobData>(VOTE_QUEUE_NAME, { connection: redis })

if (process.env.NODE_ENV !== 'production') globalForQueue.voteQueue = voteQueue
