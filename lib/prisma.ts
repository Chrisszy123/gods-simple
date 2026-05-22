import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Always reuse the singleton — both dev and prod.
// Without this, each Next.js worker spawns its own PrismaClient with a full
// connection pool, which rapidly exhausts memory on the 512 MB Render free tier.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: [] })

globalForPrisma.prisma = prisma
