import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_KEY exists:', !!supabaseKey);
    console.log('- SUPABASE_URL value:', supabaseUrl);
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl
        }
      });
    }

    // Test connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: error
      });
    }

    console.log('✅ Database connection successful');
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    });
  }
}