import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const originalUrl = process.env.DATABASE_URL
    
    // Test different URL formats
    const urlVariations = [
      // Original
      originalUrl,
      // With proper password encoding
      "postgresql://postgres:Nxreport%268899@db.kmdvxphsbtyiorwbvklg.supabase.co:5432/postgres?sslmode=require",
      // With different SSL mode
      "postgresql://postgres:Nxreport%268899@db.kmdvxphsbtyiorwbvklg.supabase.co:5432/postgres?sslmode=prefer",
      // With connection timeout
      "postgresql://postgres:Nxreport%268899@db.kmdvxphsbtyiorwbvklg.supabase.co:5432/postgres?sslmode=require&connect_timeout=10",
      // Using pooler URL
      "postgresql://postgres.kmdvxphsbtyiorwbvklg:Nxreport%268899@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
    ]

    const { PrismaClient } = require('@prisma/client')
    const results = []

    for (let i = 0; i < urlVariations.length; i++) {
      const url = urlVariations[i]
      if (!url) continue

      try {
        const prisma = new PrismaClient({
          datasources: {
            db: { url }
          }
        })

        await prisma.$connect()
        const result = await prisma.$queryRaw`SELECT 1 as test, current_database() as db_name, version() as version`
        await prisma.$disconnect()

        results.push({
          index: i,
          success: true,
          url: url.replace(/:[^:@]*@/, ':***@'), // Hide password
          result
        })
        
        // If first one works, we're good
        if (i === 0) break
        
      } catch (error) {
        results.push({
          index: i,
          success: false,
          url: url.replace(/:[^:@]*@/, ':***@'), // Hide password
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.status(200).json({
      success: true,
      results,
      recommendation: results.find(r => r.success) ? 'Found working connection' : 'No working connection found'
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}