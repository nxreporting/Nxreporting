const { createClient } = require('./frontend/node_modules/@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📊 Configuration:');
  console.log('- URL:', supabaseUrl);
  console.log('- Key exists:', !!supabaseKey);
  console.log('- Key length:', supabaseKey?.length || 0);
  console.log('- Key starts with:', supabaseKey?.substring(0, 20) + '...');
  
  if (!supabaseKey || supabaseKey.includes('your_supabase_service_role_key_here') || supabaseKey.includes('YourServiceRoleKeyHere')) {
    console.error('❌ Invalid or placeholder Supabase service role key detected');
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Go to https://supabase.com/dashboard/project/kmdvxphsbtyiorwbvklg');
    console.log('2. Navigate to Settings > API');
    console.log('3. Copy the "service_role" key (not the anon key)');
    console.log('4. Update your .env file with the real key');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test connection by trying to query the users table
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      if (error.message.includes('JWT')) {
        console.log('💡 This looks like an invalid service role key issue');
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Test query result:', data);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testSupabaseConnection();