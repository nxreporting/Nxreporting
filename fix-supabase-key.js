// Quick fix script for Supabase service role key
// Run this after you get the real key from Supabase dashboard

const fs = require('fs');
const path = require('path');

console.log('🔧 Supabase Service Role Key Fix Script');
console.log('');

// Check current .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Current .env status:');
if (envContent.includes('REPLACE_WITH_REAL_SUPABASE_SERVICE_ROLE_KEY')) {
  console.log('❌ Placeholder key detected');
} else if (envContent.includes('your_supabase_service_role_key_here')) {
  console.log('❌ Default placeholder detected');
} else {
  console.log('✅ Key appears to be set');
}

console.log('');
console.log('🔧 To fix the "Database error occurred" issue:');
console.log('');
console.log('1. Go to: https://supabase.com/dashboard/project/kmdvxphsbtyiorwbvklg');
console.log('2. Click on Settings → API');
console.log('3. Copy the "service_role" key (starts with "eyJ...")');
console.log('4. Replace REPLACE_WITH_REAL_SUPABASE_SERVICE_ROLE_KEY in .env with the real key');
console.log('5. Restart your application');
console.log('');
console.log('💡 The service_role key is different from the anon key!');
console.log('   Make sure you copy the right one.');