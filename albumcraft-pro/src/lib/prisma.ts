import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown com timeout
const gracefulShutdown = async () => {
  try {
    await Promise.race([
      prisma.$disconnect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Disconnect timeout')), 5000)
      )
    ])
  } catch (error) {
    console.error('Error during Prisma disconnect:', error)
  }
}

process.on('beforeExit', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)