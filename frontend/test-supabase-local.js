const { createClient } = require('@supabase/supabase-js')

// Test Supabase connection locally
async function testSupabase() {
  const supabaseUrl = 'https://kmdvxphsbtyiorwbvklg.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key exists:', !!supabaseKey)
  console.log('Key length:', supabaseKey?.length || 0)
  console.log('Key starts with:', supabaseKey?.substring(0, 20) || 'N/A')
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
    return
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test 1: Check if we can connect
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase query failed:', error.message)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      return
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Query result:', data)
    
    // Test 2: Try to create a test user (will rollback)
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'USER'
      })
      .select()
    
    if (insertError) {
      console.log('⚠️  Insert test failed (this might be expected):', insertError.message)
    } else {
      console.log('✅ Insert test successful:', insertData)
      
      // Clean up - delete the test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test@example.com')
      console.log('🧹 Cleaned up test user')
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testSupabase()