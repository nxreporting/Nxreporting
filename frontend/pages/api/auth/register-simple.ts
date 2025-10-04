import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    })
  }

  try {
    // Log environment variables for debugging
    console.log('Environment check:', {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    })

    // Basic validation
    const { email, password, name } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, password, and name are required' }
      })
    }

    // Test password hashing
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('Password hashed successfully')

    // Test JWT generation
    const jwt = require('jsonwebtoken')
    const jwtSecret = process.env.JWT_SECRET
    
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: { message: 'JWT_SECRET not configured' }
      })
    }

    const token = jwt.sign(
      { email, name },
      jwtSecret,
      { expiresIn: '7d' }
    )
    console.log('JWT generated successfully')

    // Test database connection
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
      
      // Try to count users
      const userCount = await prisma.user.count()
      console.log('User count:', userCount)
      
      await prisma.$disconnect()
    } catch (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({
        success: false,
        error: { 
          message: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }
      })
    }

    // If we get here, everything is working
    res.status(200).json({
      success: true,
      message: 'All systems working',
      data: {
        email,
        name,
        hasToken: !!token,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Registration test error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      }
    })
  }
}