// Quick test to check if the API key is being read correctly
require('dotenv').config({ path: './frontend/.env.local' });

console.log('🔍 Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OCR_SPACE_API_KEY exists:', !!process.env.OCR_SPACE_API_KEY);
console.log('OCR_SPACE_API_KEY length:', process.env.OCR_SPACE_API_KEY?.length || 0);
console.log('OCR_SPACE_API_KEY first 5 chars:', process.env.OCR_SPACE_API_KEY?.substring(0, 5) || 'undefined');

// Test the EnvironmentConfig validation
try {
  const { EnvironmentConfig } = require('./frontend/lib/services/pdfExtractor.ts');
  const apiKey = EnvironmentConfig.validateApiKey();
  console.log('✅ API key validation passed');
  console.log('API key length:', apiKey.length);
} catch (error) {
  console.error('❌ API key validation failed:', error.message);
}