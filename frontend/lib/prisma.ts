import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize for serverless environments
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Store the instance globally in development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Ensure connections are properly closed in serverless environments
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Helper function to handle database connection errors
export async function connectToDatabase() {
  try {
    await prisma.$connect()
    return { success: true }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    }
  }
}

// Helper function to safely disconnect from database
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect()
    return { success: true }
  } catch (error) {
    console.error('Database disconnection failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown disconnection error' 
    }
  }
}