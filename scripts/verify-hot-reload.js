#!/usr/bin/env node

/**
 * Hot Reload Verification Script
 * This script helps verify that hot reloading is working correctly
 */

const fs = require('fs')
const path = require('path')

console.log('🔥 Hot Reload Verification')
console.log('=========================')

// Test files to verify hot reloading
const testFiles = {
  apiRoute: 'frontend/pages/api/dev-test.ts',
  component: 'frontend/src/components/DevTestComponent.tsx',
  nextConfig: 'frontend/next.config.js'
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`)
    return true
  } else {
    console.log(`❌ ${description}: ${filePath} (missing)`)
    return false
  }
}

function checkHotReloadConfig() {
  console.log('\n1. Checking hot reload configuration files...')
  
  let allFilesExist = true
  
  allFilesExist &= checkFileExists(testFiles.apiRoute, 'API test route')
  allFilesExist &= checkFileExists(testFiles.component, 'Test component')
  allFilesExist &= checkFileExists(testFiles.nextConfig, 'Next.js config')
  
  return allFilesExist
}

function checkPackageScripts() {
  console.log('\n2. Checking package.json scripts...')
  
  const packageJsonPath = 'frontend/package.json'
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ frontend/package.json not found')
    return false
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const scripts = packageJson.scripts || {}
  
  const requiredScripts = ['dev', 'dev:debug', 'dev:setup']
  let allScriptsExist = true
  
  for (const script of requiredScripts) {
    if (scripts[script]) {
      console.log(`✅ Script "${script}": ${scripts[script]}`)
    } else {
      console.log(`❌ Script "${script}": missing`)
      allScriptsExist = false
    }
  }
  
  return allScriptsExist
}

function checkEnvironmentFiles() {
  console.log('\n3. Checking environment configuration...')
  
  const envFiles = [
    'frontend/.env.development',
    'frontend/.env.local',
    'frontend/.env.example'
  ]
  
  let allEnvFilesExist = true
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile}`)
      
      // Check for FAST_REFRESH setting
      const content = fs.readFileSync(envFile, 'utf8')
      if (content.includes('FAST_REFRESH')) {
        console.log(`   ✅ FAST_REFRESH configured`)
      }
    } else {
      console.log(`❌ ${envFile} (missing)`)
      allEnvFilesExist = false
    }
  }
  
  return allEnvFilesExist
}

function generateHotReloadInstructions() {
  console.log('\n4. Hot Reload Testing Instructions:')
  console.log('=====================================')
  
  console.log('\n📝 To test hot reloading:')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Open http://localhost:3000 in your browser')
  console.log('3. Make changes to files and observe automatic updates')
  
  console.log('\n🔧 API Route Hot Reload Test:')
  console.log('1. Edit frontend/pages/api/dev-test.ts')
  console.log('2. Change the version number or message')
  console.log('3. Save the file')
  console.log('4. Visit http://localhost:3000/api/dev-test')
  console.log('5. Verify changes appear immediately')
  
  console.log('\n⚛️ Component Hot Reload Test:')
  console.log('1. Edit frontend/src/components/DevTestComponent.tsx')
  console.log('2. Change text or styling')
  console.log('3. Save the file')
  console.log('4. Observe changes in browser without page refresh')
  
  console.log('\n🎯 Integration Test:')
  console.log('1. Add DevTestComponent to a page')
  console.log('2. Click "Test API Hot Reload" button')
  console.log('3. Verify API and component work together')
}

function main() {
  const configOk = checkHotReloadConfig()
  const scriptsOk = checkPackageScripts()
  const envOk = checkEnvironmentFiles()
  
  console.log('\n🏁 Verification Summary')
  console.log('======================')
  
  if (configOk && scriptsOk && envOk) {
    console.log('✅ Hot reload configuration is complete!')
    console.log('🚀 Ready to start development with hot reloading')
  } else {
    console.log('⚠️  Some configuration issues found')
    console.log('Please review the items marked with ❌ above')
  }
  
  generateHotReloadInstructions()
}

main()