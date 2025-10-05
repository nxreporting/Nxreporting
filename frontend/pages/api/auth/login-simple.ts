import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

// Simple in-memory user store for testing
const testUsers = [
  {
    id: 'user_001',
    email: 'test@example.com',
    name: 'Test User',
    password: 'testpassword123', // In production, this would be hashed
    role: 'USER'
  },
  {
    id: 'admin_001',
    email: 'admin@example.com', 
    name: 'Admin User',
    password: 'adminpassword123',
    role: 'ADMIN'
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    })
  }

  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' }
      })
    }

    console.log('🔍 Login attempt for:', email)

    // Find user in test users
    const user = testUsers.find(u => u.email === email && u.password === password)
    
    if (!user) {
      console.log('❌ Invalid credentials for:', email)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    console.log('✅ User found:', user.email, user.role)

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-testing'
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    console.log('🎫 Token generated for:', user.email)

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({
      success: false,
      error: { 
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }
    })
  }
}