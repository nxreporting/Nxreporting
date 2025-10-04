import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL not set'
      })
    }

    // Parse the URL to check format
    let parsedUrl
    try {
      parsedUrl = new URL(databaseUrl)
    } catch (urlError) {
      return res.status(500).json({
        success: false,
        error: 'Invalid DATABASE_URL format',
        details: urlError instanceof Error ? urlError.message : 'Unknown URL error'
      })
    }

    // Test different connection formats
    const connectionTests = {
      originalUrl: databaseUrl,
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      database: parsedUrl.pathname.substring(1),
      username: parsedUrl.username,
      hasPassword: !!parsedUrl.password,
      protocol: parsedUrl.protocol,
      searchParams: parsedUrl.searchParams.toString()
    }

    // Try to connect with Prisma
    const { PrismaClient } = require('@prisma/client')
    
    // Test with original URL
    let prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })

    try {
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1 as test`
      await prisma.$disconnect()
      
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
        connectionInfo: connectionTests
      })
    } catch (dbError) {
      await prisma.$disconnect()
      
      // Try alternative connection string format
      const alternativeUrl = databaseUrl.replace('?sslmode=require', '?sslmode=require&connect_timeout=10')
      
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: alternativeUrl
          }
        }
      })

      try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1 as test`
        await prisma.$disconnect()
        
        return res.status(200).json({
          success: true,
          message: 'Database connection successful with alternative URL',
          connectionInfo: connectionTests,
          usedAlternativeUrl: true
        })
      } catch (altError) {
        await prisma.$disconnect()
        
        return res.status(500).json({
          success: false,
          error: 'Database connection failed',
          connectionInfo: connectionTests,
          originalError: dbError instanceof Error ? dbError.message : 'Unknown error',
          alternativeError: altError instanceof Error ? altError.message : 'Unknown error'
        })
      }
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}