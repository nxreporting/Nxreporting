#!/usr/bin/env node

/**
 * Development Environment Test Script
 * Tests the new Vercel + Supabase development setup
 */

const http = require('http')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const FRONTEND_URL = 'http://localhost:3000'
const TEST_ENDPOINTS = [
  '/api/health',
  '/api/dev-test'
]

console.log('🧪 Testing Development Environment Setup')
console.log('=====================================')

// Test 1: Check if Next.js dev server is running
async function testServerRunning() {
  console.log('\n1. Testing if development server is running...')
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/health`)
    if (response.ok) {
      console.log('✅ Development server is running')
      return true
    } else {
      console.log(`❌ Server responded with status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Development server is not running')
    console.log('   Please start it with: npm run dev')
    return false
  }
}

// Test 2: Check API routes
async function testApiRoutes() {
  console.log('\n2. Testing API routes...')
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      const response = await fetch(`${FRONTEND_URL}${endpoint}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - OK`)
        if (endpoint === '/api/dev-test') {
          console.log(`   Message: ${data.message}`)
          console.log(`   Hot Reload: ${data.hotReload ? 'Enabled' : 'Disabled'}`)
        }
      } else {
        console.log(`❌ ${endpoint} - Failed (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
  }
}

// Test 3: Check environment configuration
function testEnvironmentConfig() {
  console.log('\n3. Testing environment configuration...')
  
  const envFiles = [
    'frontend/.env.local',
    'frontend/.env.development',
    'frontend/.env.example'
  ]
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile} exists`)
      
      // Check for required variables
      const content = fs.readFileSync(envFile, 'utf8')
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET']
      
      for (const varName of requiredVars) {
        if (content.includes(varName)) {
          console.log(`   ✅ ${varName} configured`)
        } else {
          console.log(`   ⚠️  ${varName} not found`)
        }
      }
    } else {
      console.log(`❌ ${envFile} missing`)
    }
  }
}

// Test 4: Check database connection
async function testDatabaseConnection() {
  console.log('\n4. Testing database connection...')
  
  try {
    // Change to frontend directory and test Prisma
    process.chdir('frontend')
    
    // Test Prisma client generation
    execSync('npx prisma generate', { stdio: 'pipe' })
    console.log('✅ Prisma client generated successfully')
    
    // Test database connection (this will fail if DB is not accessible)
    execSync('npx prisma db pull --force', { stdio: 'pipe' })
    console.log('✅ Database connection successful')
    
  } catch (error) {
    console.log('❌ Database connection failed')
    console.log('   Please check your DATABASE_URL in .env.local')
  } finally {
    // Change back to root directory
    process.chdir('..')
  }
}

// Test 5: Check hot reloading setup
function testHotReloadConfig() {
  console.log('\n5. Testing hot reload configuration...')
  
  const nextConfigPath = 'frontend/next.config.js'
  if (fs.existsSync(nextConfigPath)) {
    console.log('✅ Next.js config exists')
    
    const packageJsonPath = 'frontend/package.json'
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      if (packageJson.scripts && packageJson.scripts.dev) {
        console.log('✅ Development script configured')
        console.log(`   Command: ${packageJson.scripts.dev}`)
      } else {
        console.log('❌ Development script not found')
      }
    }
  } else {
    console.log('❌ Next.js config missing')
  }
}

// Main test runner
async function runTests() {
  const serverRunning = await testServerRunning()
  
  if (serverRunning) {
    await testApiRoutes()
  }
  
  testEnvironmentConfig()
  await testDatabaseConnection()
  testHotReloadConfig()
  
  console.log('\n🏁 Development Environment Test Complete')
  console.log('=====================================')
  
  if (serverRunning) {
    console.log('✅ Your development environment is ready!')
    console.log(`🌐 Application: ${FRONTEND_URL}`)
    console.log(`🔧 API Routes: ${FRONTEND_URL}/api/*`)
  } else {
    console.log('⚠️  Start the development server with: npm run dev')
  }
}

// Add fetch polyfill for Node.js < 18
if (!global.fetch) {
  global.fetch = require('node-fetch')
}

runTests().catch(console.error)