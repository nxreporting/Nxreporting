import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendSuccess, sendError, validateMethod } from '../../../lib/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  try {
    console.log('📊 Stock reports list API called');

    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return sendError(res, 'Database configuration missing', 500, 'CONFIG_ERROR');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('❌ Database connection failed:', testError);
        return sendError(res, 'Database connection failed', 500, 'DB_CONNECTION_ERROR');
      }
    } catch (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return sendError(res, 'Unable to connect to database', 500, 'CONNECTION_ERROR');
    }

    // Try to check if stock_reports table exists
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('stock_reports')
        .select('id, report_title, date_range, total_items, total_sales_value, processed_at')
        .limit(10);

      if (reportsError) {
        console.log('⚠️ Stock reports table not found, returning setup message');
        return sendSuccess(res, {
          reports: [],
          pagination: {
            total: 0,
            limit: 10,
            offset: 0,
            hasMore: false
          },
          companies: [],
          summary: {
            totalReports: 0,
            companiesCount: 0
          },
          needsSetup: true,
          setupMessage: 'Database tables need to be created. Upload a PDF first to initialize the database.',
          status: 'No data yet - upload your first PDF to get started!'
        });
      }

      // If we have data, return it
      console.log(`✅ Found ${reportsData?.length || 0} reports`);
      
      return sendSuccess(res, {
        reports: reportsData?.map(report => ({
          report_id: report.id,
          company_name: 'Unknown', // Will be populated when companies table is available
          report_title: report.report_title,
          date_range: report.date_range,
          total_items: report.total_items,
          total_sales_value: report.total_sales_value,
          total_closing_value: 0,
          processed_at: report.processed_at,
          items_with_sales: 0,
          avg_item_price: 0
        })) || [],
        pagination: {
          total: reportsData?.length || 0,
          limit: 10,
          offset: 0,
          hasMore: false
        },
        companies: [],
        summary: {
          totalReports: reportsData?.length || 0,
          companiesCount: 0
        }
      });

    } catch (queryError) {
      console.error('❌ Query error:', queryError);
      return sendError(res, 'Database query failed', 500, 'QUERY_ERROR');
    }

  } catch (error: any) {
    console.error('❌ Error in stock reports list:', error);
    return sendError(res, `API Error: ${error.message}`, 500, 'API_ERROR');
  }
}