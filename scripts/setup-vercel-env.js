#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * 
 * This script helps set up environment variables for Vercel deployment.
 * Run with: node scripts/setup-vercel-env.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  {
    name: 'DATABASE_URL',
    description: 'Supabase PostgreSQL connection string',
    example: 'postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL (public)',
    example: 'https://[project-ref].supabase.co',
    required: true
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (secret)',
    example: 'eyJ...',
    required: true
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT signing secret (minimum 32 characters)',
    example: 'your-super-secure-jwt-secret-key-here',
    required: true
  },
  {
    name: 'JWT_EXPIRES_IN',
    description: 'JWT token expiration time',
    example: '7d',
    required: false,
    default: '7d'
  },
  {
    name: 'NANONETS_API_KEY',
    description: 'Nanonets API key for PDF extraction',
    example: 'your-nanonets-api-key',
    required: true
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key (if using AI features)',
    example: 'sk-...',
    required: false
  },
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    description: 'Vercel Blob storage token',
    example: 'vercel_blob_rw_...',
    required: true
  }
];

function generateVercelEnvCommands() {
  console.log('🚀 Vercel Environment Variables Setup\n');
  console.log('Copy and paste these commands to set up your Vercel environment variables:\n');
  
  REQUIRED_ENV_VARS.forEach(envVar => {
    const isRequired = envVar.required ? '(REQUIRED)' : '(OPTIONAL)';
    console.log(`# ${envVar.description} ${isRequired}`);
    console.log(`vercel env add ${envVar.name}`);
    console.log(`# Example: ${envVar.example}`);
    if (envVar.default) {
      console.log(`# Default: ${envVar.default}`);
    }
    console.log('');
  });

  console.log('\n📋 Alternative: Set via Vercel Dashboard');
  console.log('Go to your project settings: https://vercel.com/dashboard/[project]/settings/environment-variables\n');
  
  REQUIRED_ENV_VARS.forEach(envVar => {
    console.log(`${envVar.name}=${envVar.example}`);
  });
}

function validateLocalEnv() {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env.local file found. Create one for local development.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];

  REQUIRED_ENV_VARS.forEach(envVar => {
    if (envVar.required && !envContent.includes(envVar.name)) {
      missingVars.push(envVar.name);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables in .env.local:');
    missingVars.forEach(varName => console.log(`  - ${varName}`));
  } else {
    console.log('✅ All required environment variables found in .env.local');
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    validateLocalEnv();
  } else {
    generateVercelEnvCommands();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  REQUIRED_ENV_VARS,
  generateVercelEnvCommands,
  validateLocalEnv
};