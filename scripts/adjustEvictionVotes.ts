/**
 * Adjust eviction contestant votes (DB + Redis).
 *
 * Usage:
 *   npx tsx scripts/adjustEvictionVotes.ts                  ← show current standings
 *   npx tsx scripts/adjustEvictionVotes.ts add   <name> <n> ← add n votes
 *   npx tsx scripts/adjustEvictionVotes.ts remove <name> <n> ← remove n votes
 *   npx tsx scripts/adjustEvictionVotes.ts set    <name> <n> ← set exact vote count
 *
 * <name> is case-insensitive and can be partial, e.g. "symph" matches "SYMPHONIX"
 */

import 'dotenv/config'
import fetch from 'node-fetch'
if (!globalThis.fetch) (globalThis as unknown as Record<string, unknown>).fetch = fetch
import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'
import { EVICTION_NAMES } from '../lib/eviction'

const prisma = new PrismaClient()
const redis  = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
const LEADERBOARD_KEY = 'leaderboard'

// ── helpers ───────────────────────────────────────────────────────────────────

function pad(s: string, n: number) { return s.padEnd(n) }

async function fetchAll() {
  const rows = await prisma.contestant.findMany({
    where:  { stageName: { in: EVICTION_NAMES, mode: 'insensitive' } },
    select: { id: true, stageName: true, totalVotes: true },
    orderBy: { totalVotes: 'desc' },
  })

  // overlay Redis scores (source of truth for live display)
  const result: Array<{ id: string; stageName: string; totalVotes: number; redisScore: number }> = []
  for (const r of rows) {
    const score = await redis.zscore(LEADERBOARD_KEY, r.id)
    result.push({ ...r, redisScore: score !== null ? Number(score) : r.totalVotes })
  }
  return result.sort((a, b) => b.redisScore - a.redisScore)
}

function printTable(rows: Awaited<ReturnType<typeof fetchAll>>) {
  console.log('\n  #  ' + pad('Name', 22) + pad('DB votes', 12) + 'Redis score')
  console.log('  ' + '─'.repeat(54))
  rows.forEach((c, i) => {
    console.log(`  ${i + 1}  ${pad(c.stageName, 22)}${pad(String(c.totalVotes), 12)}${c.redisScore}`)
  })
  console.log()
}

function findContestant(rows: Awaited<ReturnType<typeof fetchAll>>, query: string) {
  const q = query.trim().toUpperCase()
  const match = rows.find(c => c.stageName.trim().toUpperCase().includes(q))
  if (!match) {
    console.error(`\n  ✗ No eviction contestant matching "${query}"`)
    console.error(`  Available: ${rows.map(c => c.stageName).join(', ')}\n`)
    process.exit(1)
  }
  return match
}

async function applyChange(id: string, stageName: string, newCount: number) {
  if (newCount < 0) newCount = 0

  await prisma.contestant.update({
    where: { id },
    data:  { totalVotes: newCount },
  })

  if (newCount > 0) {
    await redis.zadd(LEADERBOARD_KEY, { score: newCount, member: id })
  } else {
    await redis.zrem(LEADERBOARD_KEY, id)
  }

  console.log(`\n  ✓ ${stageName} → ${newCount} votes (DB + Redis updated)\n`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  const args      = process.argv.slice(2)
  const command   = args[0]
  const amountArg = args[args.length - 1]
  const nameArg   = args.slice(1, -1).join(' ')

  const rows = await fetchAll()

  // No args — just show standings
  if (!command || args.length === 0) {
    console.log('\n  Current eviction standings:')
    printTable(rows)
    await prisma.$disconnect()
    return
  }

  if (!['add', 'remove', 'set'].includes(command)) {
    console.error(`\n  Unknown command "${command}". Use: add | remove | set\n`)
    process.exit(1)
  }

  if (!nameArg || !amountArg) {
    console.error(`\n  Usage: npx tsx scripts/adjustEvictionVotes.ts ${command} <name> <amount>\n`)
    process.exit(1)
  }

  const amount = parseInt(amountArg, 10)
  if (isNaN(amount) || amount < 0) {
    console.error(`\n  Amount must be a non-negative integer. Got: "${amountArg}"\n`)
    process.exit(1)
  }

  const contestant = findContestant(rows, nameArg)
  const current    = contestant.redisScore  // use Redis as source of truth

  let newCount: number
  switch (command) {
    case 'add':    newCount = current + amount; break
    case 'remove': newCount = current - amount; break
    case 'set':    newCount = amount;            break
    default:       newCount = current
  }

  console.log(`\n  ${contestant.stageName}`)
  console.log(`  Current: ${current} votes`)
  console.log(`  Action:  ${command} ${amount}`)
  console.log(`  Result:  ${Math.max(0, newCount)} votes`)

  await applyChange(contestant.id, contestant.stageName, newCount)

  console.log('  Updated standings:')
  printTable(await fetchAll())

  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
