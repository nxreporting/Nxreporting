import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// Simple CUID generator (similar to Prisma's cuid())
function generateCuid(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 15)
    return `c${timestamp}${randomPart}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Test registration with actual data
        const testEmail = `test-${Date.now()}@example.com`
        const testPassword = 'testpassword123'
        const testName = 'Test User'
        const role = 'USER'
        const userId = generateCuid() // Generate ID manually

        // Create Supabase client
        const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseServiceKey) {
            return res.status(500).json({
                success: false,
                error: 'Missing Supabase key'
            })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Hash password
        const hashedPassword = await bcrypt.hash(testPassword, 12)

        // Create user with explicit ID
        const now = new Date().toISOString()
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId, // Explicitly provide the ID
                email: testEmail,
                password: hashedPassword,
                name: testName,
                role,
                createdAt: now,
                updatedAt: now
            })
            .select('id, email, name, role, createdAt')
            .single()

        if (insertError) {
            return res.status(500).json({
                success: false,
                error: 'Failed to create user',
                details: insertError.message,
                code: insertError.code
            })
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                error: 'Missing JWT secret'
            })
        }

        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            },
            jwtSecret,
            { expiresIn: '7d' }
        )

        // Clean up - delete the test user
        await supabase
            .from('users')
            .delete()
            .eq('id', newUser.id)

        // Return success
        res.status(200).json({
            success: true,
            message: 'Registration test with manual ID completed successfully!',
            testUser: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            },
            tokenGenerated: !!token,
            tokenLength: token.length,
            generatedId: userId
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })
    }
}